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


// Create object upload promise
const uploadPromise = new AWS.S3({
    apiVersion: '2006-03-01'
});

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

    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: filePath.split('./blog/.vuepress/dist/').pop(),
        Body: contents
    };

    uploadPromise.upload(params, function(err, data) {
        console.log(err, data);
    });
}

