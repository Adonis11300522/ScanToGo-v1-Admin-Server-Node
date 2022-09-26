const express = require('express');
const router = express.Router();
const { validate, ValidationError, Joi } = require('express-validation');
const AWS = require('aws-sdk');
var multer  = require('multer');
const s3 = new AWS.S3({
  accessKeyId: process.env.SCANNGET_AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.SCANNGET_AWS_S3_SECRET_ACCESS_KEY,
});
const fs = require('fs');

// const upload = multer({dest : 'public/images'});

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

router.post('/', (req, res, next) => {
  console.log("=========================")
  // console.log(req.file);
});








// router.post('/', async function (req, res, next) {
  
//   // return
//   const file = req.body.fileName;
//   let fileKey = req.body.fileKey;
//   const contentType = req.body.contentType;

//   if (!fileKey) {
//     fileKey = new Date().getTime().toString();
//   }

//   console.log("controller", req)

//   // if (file) {
//   //   const fileBlob = fs.readFileSync(file);
//   //   console.log('hi--------------------------------------------' + fileBlob);
//   //   const uploadedFile = await s3.upload({
//   //     Bucket: process.env.SCANNGET_AWS_BUCKET,
//   //     Key: fileKey,
//   //     Body: fileBlob,
//   //     ContentType: contentType ? contentType : 'auto'
//   //   }).promise();

//   //   const url = uploadedFile.Location;


//   //   res.json({
//   //     status: true,
//   //     data: url
//   //   });
//   // }
//   // else {
//   //   res.json({
//   //     status: false,
//   //     errorCode: "Error_EmptyFile"
//   //   });
//   // }
// });

module.exports = router;