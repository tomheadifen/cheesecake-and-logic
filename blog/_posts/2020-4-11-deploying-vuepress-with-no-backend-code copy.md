---
date: 2020-04-11
tags: 
  - vuepress
  - code
  - aws
author: Thomas Headifen
location: Toronto, Canada  
---

# Deploying Vuepress with no backend code!
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
[https://docs.aws.amazon.com/AmazonS3/latest/dev/EnableWebsiteHosting.html](docs.aws.amazon.com/AmazonS3/latest/dev/EnableWebsiteHosting.html)

On step 7 the docs say this:
> 7. (Optional) If you want to add a custom error document, in the Error document box, enter the key name for the error document (for example, error.html).
The error document name is case sensitive and must exactly match the file name of the HTML error document that you plan to upload to your S3 bucket. For more information, see (Optional) configuring a custom error document.

You can set this error document to index.html as vuepress routing will handle 404s.

Great! Next just drag your dist folder into your bucket.

## Pointing Route 53 to your S3 Bucket
To accomplish this you need to follow this tutorial under the ‘Configuring Amazon Route 53 to route traffic to an S3 Bucket’ section.

[https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/RoutingToS3Bucket.html#routing-to-s3-bucket-configuring](docs.aws.amazon.com/Route53/latest/DeveloperGuide/RoutingToS3Bucket.html#routing-to-s3-bucket-configuring)

After that wait about a minute and you should be able to navigate to your Vuepress site. Note that you don’t have to use Vuepress. You could host a simple “Hello World!” html document.

## Conclusion
AWS docs are annoying and stupid.