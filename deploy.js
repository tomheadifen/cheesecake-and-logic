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
    await new Promise((resolve, reject) => {
        api.listObjects({Bucket: process.env.AWS_BUCKET}, (error, data) => {
            if (data.Contents.length > 0) {
                console.log('Deleting files');
                
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
                        reject()
                    } else {
                        console.log(data)
                        resolve()
                    }
                })
            } else {
                console.log('The bucket was empty')
                resolve()
            }
        })
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
        // If we are retrieving a file that is not an image we have to pass in the utf8 type
        const imageExtensions = ['png', 'gif', 'jpg', 'svg', 'ico']
        const extension = filePath.split('.').pop()
        const contents = fs.readFileSync(filePath)
        
        // S3 does not set the Content type by default so we have to do this.
        // Apache servers often do this for us but with S3 we have to.
        // If we don't do this the site would not load correctly.
        let contentType = 'application/octet-stream' // S3 default
        if (extension == 'html') contentType = "text/html"
        if (extension == 'css') contentType = "text/css"
        if (extension == 'js') contentType = "application/javascript"
        if (imageExtensions.includes(extension)) {
            contentType = "image/" + extension
        }

        let awsKey = filePath.split('./blog/.vuepress/dist/').pop()

        const params = {
            Bucket: process.env.AWS_BUCKET,
            // The key is the file path on S3
            Key: filePath.split('./blog/.vuepress/dist/').pop(),
            Body: contents,
            ContentType: contentType
        }

        api.putObject(params, function(err, data) {
            console.log('Uploaded: ' + awsKey)
        })
    }
})()