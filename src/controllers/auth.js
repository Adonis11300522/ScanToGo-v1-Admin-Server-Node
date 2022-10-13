const express = require('express');
const router = express.Router();
const { validate, ValidationError, Joi } = require('express-validation');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.SCANNGET_AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.SCANNGET_AWS_S3_SECRET_ACCESS_KEY,
});
const fs = require('fs');
const moment = require('moment');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const hash = require('../common/hash');
const AuthToken = require('../common/jwt').AuthToken;

const User = require('../models/user');

/**
 * API: /auth/signin
 * Type: POST
 * 
 * Receives email and password, check credentials in the database and if it's valid user, return user information & token
 * 
 * Data: {
 *   email: string,
 *   password: string
 * }
 * 
 * Response: {
 *   status: true or false,
 *   errorCode: Error_UserNotFound | Error_IncorrectPassword | Error_EmailNotVerified | Error_PhoneNotVerified | Error_InactiveUser | Error_ClosedUser | Error_BlockedUser,
 *   data: {
 *     id: number,
 *     email: string,
 *     firstName: string,
 *     lastName: string,
 *     apiToken: string
 *   }
 * }
 */
router.use('/signin', validate({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
}, {}, {allowUnknown: true, abortEarly: false}), async function (req, res, next) {
  const { email, password } = req.body;

  const user = await User.findOne({
    where: {
      email: email
    }
  });

  if (!user) {
    return res.json({
      status: false,
      errorCode: "Error_UserNotFound"
    });
  }

  const match = await hash.verify(password, user.password);
  if (!match) {
    return res.json({
      status: false,
      errorCode: "Error_IncorrectPassword"
    });
  }

  // if (!user.emailVerifiedAt) {
  //   return res.json({
  //     status: false,
  //     errorCode: "Error_EmailNotVerified",
  //   });
  // }

  // if (!user.phoneVerifiedAt) {
  //   return res.json({
  //     status: false,
  //     errorCode: "Error_PhoneNotVerified"
  //   });
  // }

  switch (user.status) {
    case User.STATUS.INACTIVE:
      return res.json({
        status: false,
        errorCode: "Error_InactiveUser"
      });
    case User.STATUS.CLOSED:
      return res.json({
        status: false,
        errorCode: "Error_ClosedUser"
      });
    case User.STATUS.BLOCKED:
      return res.json({
        status: false,
        errorCode: "Error_BlockedUser"
      });
  }

  user.apiToken = AuthToken.generate(email, user.password);
  await user.save();

  res.json({
    status: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      apiToken: user.apiToken,
      role: user.role,
      CustomerId: user.CustomerId
    }
  });
});

/**
 * API: /auth/signup
 * Type: POST
 * 
 * Receives user registration information such as email, name, etc and save it in the database
 * 
 * Data: {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   password: string,
 *   phoneNumber: string,
 * }
 * 
 * Response: {
 *   status: true or false,
 *   errorCode: string | Error_InvalidRequest | Error_DuplicateEmail,
 * 
 *   // Error_InvalidRequest
 *   data: [
 *     { key: key name, message: error message },
 *     ...
 *   ]
 * 
 *   // Error_DuplicateEmail
 *   data: undefined
 * 
 *   // Success
 *   data: {
 *     id: number,
 *     email: string,
 *     firstName: string,
 *     lastName: string,
 *     apiToken: string
 *   }
 * }
 */
router.use('/signup', validate({
  body: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    phoneNumber: Joi.string().required(),
  })
}, {}, {allowUnknown: true, abortEarly: false}), async function (req, res, next) {
  const data = req.body;

  let user = await User.findOne({
    where: {
      email: data.email
    }
  });
  if (user) {
    return res.json({
      status: false,
      errorCode: "Error_DuplicateEmail",
    });
  }
  
  const verifyCode = crypto.randomBytes(5).toString('base64').substring(0, 5).toUpperCase();

  user = new User();
  user.firstName = data.firstName;
  user.lastName = data.lastName;
  user.email = data.email;
  user.password = await hash.generate(data.password);
  user.phoneNumber = data.phoneNumber;
  user.verifyCode = verifyCode;
  user.apiToken = AuthToken.generate(user.email, user.password);
  user.status = User.STATUS.PENDDING;

  console.log(user);
  
  await user.save();

  const transporter = nodemailer.createTransport({
    port: process.env.MAIL_PORT,
    host: process.env.MAIL_SERVER,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    },
    secure: true
  });

  const mailData = {
    from: 'support@scantogo.com',
    to: value,
    subject: 'ScanToGo Verification Code',
    text: 'Easy',
    html: `
      <div
        style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2b266d;"
      >
        <h1>Welcome to ScanToGo</h1>
        <span style="color: black">
          Thanks for using our service.
        </span>
      
        <p style="color: black">
          Here is your verification code.
        </p>
        <h3 style="padding: 24px; background-color: #ddd; font-size: 48px;">${user.verifyCode}</h3>
      
        <p style="color: black">
          Regards.
        </p>
      </div>
    `
  };

  transporter.sendMail(mailData, (error, info) => {
    if (error) {
      return res.json({
        status: false,
        errorCode: 'Error_EmailFailure',
        message: error.message,
      });
    }

    res.json({
      status: true,
    });
  });

  return res.json({
    status: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      apiToken: user.apiToken,
      role: user.role
    }
  });
});   

/**
 * API: /auth/sendCode
 * Type: GET
 * 
 * Send email that contains verification code for specific platform to given email address
 * 
 * Params: {
 *   type: email | phone,
 *   value: email address | phone number
 * }
 * 
 * Response: {
 *   status: true or false,
 *   errorCode: Error_InvalidRequest | Error_InvalidEmail | Error_EmailFailure,
 * }
 */
router.get('/sendCode', validate({
  query: Joi.object({
    type: Joi.string().required().allow('email', 'phone').only(),
    value: Joi.string().required()
  })
}, {}, {allowUnknown: true, abortEarly: false}), async function(req, res, next) {
  const { type, value } = req.query;

  if (type === 'email') {
    const user = await User.findOne({
      where: {
        email: value
      }
    });

    if (!user) {
      return res.json({
        status: false,
        errorCode: "Error_InvalidEmail",
      });
    }

    user.verifyCode = crypto.randomBytes(5).toString('base64').substring(0, 5).toUpperCase();
    await user.save();

    const transporter = nodemailer.createTransport({
      port: process.env.MAIL_PORT,
      host: process.env.MAIL_SERVER,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      },
      secure: true
    });
    const mailData = {
      from: 'support@scantogo.com',
      to: value,
      subject: 'ScanToGo Verification Code',
      text: 'Easy',
      html: `
        <div
          style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2b266d;"
        >
          <h1>Welcome to ScanToGo</h1>
          <span style="color: black">
            Thanks for using our service.
          </span>
        
          <p style="color: black">
            Here is your verification code.
          </p>
          <h3 style="padding: 24px; background-color: #ddd; font-size: 48px;">${user.verifyCode}</h3>
        
          <p style="color: black">
            Regards.
          </p>
        </div>
      `
    };

    transporter.sendMail(mailData, (error, info) => {
      if (error) {
        return res.json({
          status: false,
          errorCode: 'Error_EmailFailure',
          message: error.message,
        });
      }

      res.json({
        status: true,
      });
    });
  }
  else if (type === 'phone') {

  }
  else {
    res.json({
      status: false,
      errorCode: "ERROR_InvalidRequest",
      data: [
        {
          key: 'type',
          message: '"type" should be one of "email" or "phone"'
        }
      ]
    });
  }
});

/**
 * API: /auth/confirmCode
 * Type: GET
 * 
 * Verify if email address or phone number is belonged to the user with 5 letters code
 * 
 * Query Params: {
 *   type: email | phone,
 *   code: 5 letters,
 *   id: email address or phone number
 * }
 * 
 * Response: {
 *   status: true or false,
 *   errorCode: Error_InvalidRequest | Error_VerificationFailed | Error_InvalidIdentity
 * }
 */
router.get('/confirmCode', validate({
  query: Joi.object({
    type: Joi.string().required().allow('email', 'phone').only(),
    code: Joi.string().required().length(5),
    id: Joi.string().required()
  })
}, {}, {abortEarly: false, allowUnknown: true}), async function (req, res, next) {
  const { type, code, id } = req.query;

  let user;

  if (type === 'email') {
    user = await User.findOne({
      where: {
        email: id
      }
    });
  }
  else {
    user = await User.findOne({
      where: {
        phoneNumber: id
      }
    });
  }

  if (user) {
    if (user.verifyCode === code) {
      user.verifyCode = "";
      if (type === 'email') {
        user.emailVerifiedAt = new Date();
      }
      else {
        user.phoneVerifiedAt = new Date();
      }
      await user.save();

      if (user.emailVerifiedAt && user.phoneVerifiedAt) {
        user.status = User.STATUS.ACTIVE;
      }
      await user.save();

      return res.json({
        status: true
      });
    }
    else {
      return res.json({
        status: false,
        errorCode: "Error_VerificationFailed"
      });
    }
  }
  else {
    return res.json({
      status: false,
      errorCode: "Error_InvalidIdentity",
    });
  }
});

/**
 * API: /auth/forgotPassword
 * Type: GET
 * 
 * Send verification code to given email address
 * 
 * Query: {
 *   email: 'email address'
 * }
 * 
 * Error Codes: Error_EmailFailure, Error_InvalidEmail
 */
router.get('/forgotPassword', 
validate({
  query: Joi.object({
    email: Joi.string().email().required()
  })
}, {}, {}), 
async function (req, res, next) {

  console.log('email--------------forgot----------' + req.query.email);
  const email = req.query.email;

  const user = await User.findOne({
    where: {
      email: email
    }
  });

  if (!user) {
    return res.json({
      status: false,
      errorCode: "Error_InvalidEmail",
    });
  }

  user.verifyCode = crypto.randomBytes(5).toString('base64').substring(0, 5).toUpperCase();
  await user.save();

  const transporter = nodemailer.createTransport({
    port: process.env.MAIL_PORT,
    host: process.env.MAIL_SERVER,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    },
    secure: true
  });
  const mailData = {
    from: 'support@scantogo.com',
    to: email,
    subject: 'ScanToGo Verification Code',
    text: 'Easy',
    html: `
      <div
        style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2b266d;"
      >
        <h1>Welcome to ScanToGo</h1>
        <span style="color: black">
          Thanks for using our service.
        </span>
      
        <p style="color: black">
          Here is your verification code.
        </p>
        <h3 style="padding: 24px; background-color: #ddd; font-size: 48px;">${user.verifyCode}</h3>
      
        <p style="color: black">
          Regards.
        </p>
      </div>
    `
  };

  transporter.sendMail(mailData, (error, info) => {
    if (error) {
      return res.json({
        status: false,
        errorCode: 'Error_EmailFailure',
        message: error.message,
      });
    }

    res.json({
      status: true,
    });
  });
});

/**
 * API: /auth/confirmPasswordCode
 * Type: POST
 * 
 * Check if received verification code is valid one
 * 
 * Data: {
 *   code: '5 digits code'
 * }
 * 
 * Error Codes: Error_UserNotFound | Error_InvalidCode
 */
router.post('/confirmPasswordCode', validate({
  body: Joi.object({
    code: Joi.string().length(5).required(),
    email: Joi.string().email().required()
  })
}, {}, {}), async function (req, res, next) {
  const code = req.body.code;
  const email = req.body.email;

  const user = await User.findOne({
    where: {
      email: email
    }
  });

  if (user) {
    if (user.verifyCode === code) {
      res.json({
        status: true,
      });
    }
    else {
      res.json({
        status: false,
        errorCode: "Error_InvalidCode"
      });
    }
  }
  else {
    res.json({
      status: false,
      errorCode: "Error_UserNotFound"
    });
  }
});

/**
 * API: /auth/resetPassword
 * Type: POST
 * 
 * Check if email and verification code are valid and change password
 * 
 * Data: {
 *   email: email address,
 *   code: 5 letters code,
 *   password: new password
 * }
 * 
 * Error Codes: Error_UserNotFound | Error_InvalidCode
 */
router.post('/resetPassword', validate({
  body: Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(5).required(),
    password: Joi.string().required()
  })
}, {}, {}), async function (req, res, next) {
  const { 
    code,
    email,
    password
  } = req.body;

  const user = await User.findOne({
    where: {
      email: email
    }
  });

  if (user) {
    if (user.verifyCode === code) {
      user.emailVerifiedAt = new Date();
      user.password = await hash.generate(password);
      await user.save();

      res.json({
        status: true,
      });
    }
    else {
      res.json({
        status: false,
        errorCode: "Error_InvalidCode"
      });
    }
  }
  else {
    res.json({
      status: false,
      errorCode: "Error_UserNotFound"
    });
  }
});

/**
 * API: /auth/test
 * Type: GET
 * 
 * Check if current request is authorized or not
 */
router.get('/test', function (req, res, next) {
  if (req.auth) {
    res.json({
      status: true,
      data: {
        auth: req.auth
      }
    });
  }
  else {
    res.json({
      status: false
    });
  }
});

module.exports = router;