const express = require('express');
const router = express.Router();
const { validate, ValidationError, Joi } = require('express-validation');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.SCANNGET_AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.SCANNGET_AWS_S3_SECRET_ACCESS_KEY,
});
const fs = require('fs');

/**
 * API: /upload
 * Type: POST,
 * 
 * Upload any file with given file directory settings and return URL
 * 
 * Data: {
 *   fileKey: string,
 *   contentType: string
 * }
 * 
 * Error Codes: Error_EmptyFile
 */
router.post('/', async function (req, res, next) {
  
  // return
  const file = req.body.fileName;
  let fileKey = req.body.fileKey;
  const contentType = req.body.contentType;

  if (!fileKey) {
    fileKey = new Date().getTime().toString();
  }

  if (file) {
    const fileBlob = fs.readFileSync(file.path);
    console.log('hi--------------------------------------------' + fileBlob);
    const uploadedFile = await s3.upload({
      Bucket: process.env.SCANNGET_AWS_BUCKET,
      Key: fileKey,
      Body: fileBlob,
      ContentType: contentType ? contentType : 'auto'
    }).promise();

    const url = uploadedFile.Location;


    res.json({
      status: true,
      data: url
    });
  }
  else {
    res.json({
      status: false,
      errorCode: "Error_EmptyFile"
    });
  }
});

module.exports = router;