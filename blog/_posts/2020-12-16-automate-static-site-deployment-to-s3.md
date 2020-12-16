---
date: 2020-12-16
tags: 
  - vuepress
  - code
  - aws
  - node
author: Thomas Headifen
location: Christchurch, New Zealand  
---

# Automate Static Site Deployment to s3!
Going off the previous blog post here [here](/2020/04/10/deploying-vuepress-with-no-backend-code/) we've learned how to get a static site into s3 (in our case it was vuepress). We can simply log in to AWS every time we want to update our site but lets use a script instead.

First here's the nodejs script. You won't be able to run it till you set up AWS so I'll explain it in more detail below.  You could also achieve a similar thing using the AWS console but I prefer to leverage the AWS API instead.

```
const fs = require('fs');
const env = require('dotenv').config();
const AWS = require("aws-sdk");
const glob = require("glob")

AWS.config.getCredentials(function(err) {
  if (err) console.log(err.stack);
  // credentials not loaded
  else {
    console.log("Access key:", AWS.config.credentials.accessKeyId);
    console.log("Secret access key:", AWS.config.credentials.secretAccessKey);
  }
});

/** Deployment script to go to the s3 bucket **/
console.log('Starting deployment');


// Initialise the sdk object with our credentials (looks at the .env file)
const api = new AWS.S3({
    apiVersion: '2006-03-01'
});

(async function() {
    // Delete all the current items in the bucket so we don't get conflicts with the new one
    await api.listObjects({Bucket: process.env.AWS_BUCKET}, (error, data) => {
        if (data.Contents.lenght > 0) {
            api.deleteObjects({
                Bucket: process.env.AWS_BUCKET,
                Delete: {
                    // Map for the api request
                    Objects: data.Contents.map((bucketObject) => { return {Key: bucketObject.Key} })
                }
            }, function(error, data) {
                if (error) {
                    // an error occurred
                    console.log(error, error.stack);
                } else {
                    console.log(data);
                }
            })
        } else {
            console.log('The bucket was empty')
        }
    })

    uploadFilesToS3();

    /** AWS SDK makes it hard to upload folders so have to do one at a time **/
    function uploadFilesToS3() {
        // Get all files to upload
        const filesToUpload = glob.sync("./blog/.vuepress/dist/**/*")

        filesToUpload.forEach((filePath) => {
            // Upload each file to s3 (not directories)
            if (! fs.statSync(filePath).isDirectory()) {
                uploadFileToS3(filePath)
            }
        })
    }

    function uploadFileToS3(filePath) {
        const contents = fs.readFileSync(filePath, 'utf8')

        // S3 does not set the Conetent type by default so we have to do this.
        // Apache servers often do this for us
        // If we don't do this the site would not load correctly.
        const extension = filePath.split('.').pop();
        let contentType = 'application/octet-stream'; // S3 default
        if (extension == 'html') contentType = "text/html";
        if (extension == 'css') contentType = "text/css";
        if (extension == 'js') contentType = "application/javascript";
        if (extension == 'png' || extension == 'jpg' || extension == 'gif') contentType = "image/" + extension;

        const params = {
            Bucket: process.env.AWS_BUCKET,
            // The key is the file path on S3
            Key: filePath.split('./blog/.vuepress/dist/').pop(),
            Body: contents,
            ContentType: contentType
        };

        api.upload(params, function(err, data) {
            console.log(err, data);
        });
    }
})()
```

It's not perfect but it does the job.

This script is supposed to be added to your static site directory so you will need to make sure you have NPM installed.

First run these commands in your terminal inside your static site.
```
    npm install aws-sdk --save-dev
    npm install dotenv --save-dev
    npm install glob --save-dev
```

Next we need to setup your .env file with your aws credentials. Login to the aws console and navigate to the users section here (https://console.aws.amazon.com/iam/home#/users/).

Select the user that you want to give API acces (preferably not the root user).






One of the things that drew me to trying vue press is that it's a static site builder. As a developer writing code isn't that big of a deal so setting up a deployment script to deploy the site whenever I make changes means that:
* No Authentication
* No Authorization
* No Server to maintain / Serverless
* No api requests

Yay!

I’m writing this blog post to point people to the correct aws documentations to achieve this as I found that that information often overlapped between posts and some posts left our information.

## What is Vue Press and why should I use it?

Vuepress is a framework for Vue js. It allows you to quickly build a blog site or a docs site for things such as API documentation. It also has a MarkDown renderer so that you don’t have to deal with HTML.


To scaffold a blog post you can follow this tutorial. Essentially all you need to do is run this command:

Create an empty directory and cd into it
```
mkdir blog && cd blog
```

Then we need to install vuepress with the theme-blog.

```
yarn add vuepress @vuepress/theme-blog -D
```

This is covered here <a target='_blank' href='https://vuepress.vuejs.org/theme/blog-theme.html'>vuepress.vuejs.org/theme/blog-theme.html</a>

To take a look locally just run yarn dev (as outlines in the package.json file) as it will start a hot reload server.

Next we will prepare vue press for deploy. Run yarn build and that will create a dist directory inside of ```.vuepress/dist```. This is what you will deploy to your s3 bucket.

## Creating and Deploying to your S3 Bucket

Creating an S3 bucket is pretty straight forward however know that when you name your bucket that you must name it the same as your website url for example: cheesecakeandlogic.com. (note no ```www``` or ```http://```).

Go ahead and create your S3 Bucket.


Follow the docs linked below but when you get to step 7 see the note below.
<a target='_blank' href='https://docs.aws.amazon.com/AmazonS3/latest/dev/EnableWebsiteHosting.html'>docs.aws.amazon.com/AmazonS3/latest/dev/EnableWebsiteHosting.html</a>

On step 7 the docs say this:
> 7. (Optional) If you want to add a custom error document, in the Error document box, enter the key name for the error document (for example, error.html).
The error document name is case sensitive and must exactly match the file name of the HTML error document that you plan to upload to your S3 bucket. For more information, see (Optional) configuring a custom error document.

You can set this error document to index.html as vuepress routing will handle 404s.

Great! Next just drag your dist folder into your bucket.

## Pointing Route 53 to your S3 Bucket
To accomplish this you need to follow this tutorial under the ‘Configuring Amazon Route 53 to route traffic to an S3 Bucket’ section.

<a target='_blank' href='https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/RoutingToS3Bucket.html#routing-to-s3-bucket-configuring'>docs.aws.amazon.com/Route53/latest/DeveloperGuide/RoutingToS3Bucket.html#routing-to-s3-bucket-configuring</a>

After that wait about a minute and you should be able to navigate to your Vuepress site. Note that you don’t have to use Vuepress. You could host a simple “Hello World!” html document.

## Conclusion
AWS docs are annoying and stupid.