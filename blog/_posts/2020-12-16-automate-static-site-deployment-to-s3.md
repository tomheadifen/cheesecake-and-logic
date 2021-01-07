---
date: 2021-01-06
tags: 
  - vuepress
  - code
  - aws
  - node
author: Thomas Headifen
location: Christchurch, New Zealand  
---

# Automate Static Site Deployment to S3!
Going off the previous blog post [here](/2020/04/10/deploying-vuepress-with-no-backend-code/) we've learned how to get a static site into S3 (in our case it was vuepress). We can simply log in to AWS every time we want to update our site but lets use a deploy script instead.

## Prerequisites
- AWS hosting for a static site as shown in previous post [here](/2020/04/10/deploying-vuepress-with-no-backend-code/).
- Node installed (with a basic understanding)
- NPM or Yarn

## The Script
First here's the nodejs script. You won't be able to run it till you set up AWS so I'll explain it in more detail below.  You could also achieve a similar thing using the AWS console but I prefer to leverage the AWS API instead.

Without digging into the script too much itself it does the following things:
1. Sets up the environment so you can communicate with AWS.
2. Clears the files on S3.
3. Gets the compiled files.
4. Uploads the files to S3 with the correct settings.

```js
const fs = require('fs')
const env = require('dotenv').config()
const AWS = require("aws-sdk")
const glob = require("glob")

// AWS automatically looks at your .env file
AWS.config.getCredentials(function(err) {
  if (err) console.log(err.stack)
  // credentials not loaded
  else {
    console.log("Access key:", AWS.config.credentials.accessKeyId)
    console.log("Secret access key:", AWS.config.credentials.secretAccessKey)
  }
})

/** Deployment script to go to the s3 bucket **/
console.log('Starting deployment')

// Initialise the sdk object with our credentials (looks at the .env file)
const api = new AWS.S3({
    apiVersion: '2006-03-01'
});

(async function() {
    // Delete all the current items in the bucket so we don't get conflicts with the new one
    await api.listObjects({Bucket: process.env.AWS_BUCKET}, (error, data) => {
        if (data.Contents.length > 0) {
            api.deleteObjects({
                Bucket: process.env.AWS_BUCKET,
                Delete: {
                    // Map for the api request
                    Objects: data.Contents.map((bucketObject) => { return {Key: bucketObject.Key} })
                }
            }, function(error, data) {
                if (error) {
                    // an error occurred
                    console.log(error, error.stack)
                } else {
                    console.log(data)
                }
            })
        } else {
            console.log('The bucket was empty')
        }
    })

    // Get all files to upload
    const filesToUpload = glob.sync("./blog/.vuepress/dist/**/*")

    // AWS SDK makes it hard to upload folders so have to do one at a time
    filesToUpload.forEach((filePath) => {
        // Upload each file to s3 (not directories)
        if (! fs.statSync(filePath).isDirectory()) {
            uploadFileToS3(filePath)
        }
    })

    function uploadFileToS3(filePath) {
        const contents = fs.readFileSync(filePath)
        
        // S3 does not set the Conetent type by default so we have to do this.
        // Apache servers often do this for us but with S3 we have to.
        // If we don't do this the site would not load correctly.
        const extension = filePath.split('.').pop()
        let contentType = 'application/octet-stream' // S3 default
        if (extension == 'html') contentType = "text/html"
        if (extension == 'css') contentType = "text/css"
        if (extension == 'js') contentType = "application/javascript"
        if (extension == 'png' || extension == 'gif' || extension == 'jpg') {
            contentType = "image/" + extension
        }

        const params = {
            Bucket: process.env.AWS_BUCKET,
            // The key is the file path on S3
            Key: filePath.split('./blog/.vuepress/dist/').pop(),
            Body: contents,
            ContentType: contentType
        }

        api.putObject(params, function(err, data) {
            console.log(err, data)
        })
    }
})()
```

It's not perfect but it does the job.

This script is supposed to be added to your project directory so you will need to make sure you have NPM installed.

To get the above script working you need to do the following steps

## 1. Required Libraries

Run these commands in your terminal in the root of your project to install the required libraries.

```sh
    npm install aws-sdk --save-dev
    npm install dotenv --save-dev
    npm install glob --save-dev
```

## 2. Get the deploy script

Copy the deploy script code above into a deploy.js file in the root of your vuepress project.

## 3. Create .env file
Create a .env file for you AWS API credentials at the root of your project.

Copy the below text into your newly created .env file.
Note: Do not commit your .env file or place these keys in a location where someone can access them. e.g. a js file that gets sent to the browser.

```js
AWS_ACCESS_KEY_ID= // The visible key in aws
AWS_SECRET_ACCESS_KEY= // The key that is only visible once in aws
AWS_BUCKET= // The name of the bucket you are pushing to
```

## 4. Retrieve the .env credentials.

### Api Credentials
Login to the aws console and navigate to the users section here [https://console.aws.amazon.com/iam/home?#/users/](https://console.aws.amazon.com/iam/home?#/users/).

Next click on the 'Security Credentials' section as displayed in the picture below.

<a href="/img/aws-security-credentials.jpg" target="_blank"><img src="/img/aws-security-credentials.jpg" alt="Where to find security credentials"></a>

Now we need to create these api keys. AWS has 2 api keys, an ID and the access key itself. These get sent to AWS to authenticate that you have permission to deploy the new changes. Click on the 'Create access key' button as displayed in the previous image and copy the keys as shown in the next image.

<a href="/img/aws-create-api-key.jpg" target="_blank"><img src="/img/aws-create-api-key.jpg" alt="Where to find aws api key"></a>

Place these keys in your new .env file.

### S3 Bucket Name
Next we need the AWS_BUCKET value. You can get the name of the bucket here: [https://s3.console.aws.amazon.com/s3/](https://s3.console.aws.amazon.com/s3/).


## 5. Deploy

Run the script at your project root to deploy.

```js
npm build
node deploy.js
```

## Conclusion
You should now be able to make changes to your blog and deploy to S3 without having to log into AWS. You could retrofit the above script to work with any static site.

