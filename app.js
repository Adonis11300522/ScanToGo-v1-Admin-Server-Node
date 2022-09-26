const express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var formData = require('express-form-data');
var logger = require('morgan');
var { Sequelize } = require('sequelize');
var { ValidationError } = require('express-validation');
var os = require('os');
var Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
var cors = require('cors');
const multer = require("multer");
var fs = require("fs");
require('dotenv').config();

/**
 * Routes
 */
const indexRouter = require('./src/routes/index');
const authRouter = require('./src/controllers/auth');
const userRouter = require('./src/controllers/user_controller');
const uploadRouter = require('./src/controllers/upload_controller');
const scanRouter = require('./src/controllers/scan_controller');
const paymentRouter = require('./src/controllers/payment_controller');

const authMiddleware = require('./src/middlewares/auth_middleware');
/** ---------------------------------------- */

/**
 * Express App Config
 */
var app = express();


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + "_ScanToGo"+path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
app.post("/upload", upload.single("fileData"), (req, res) => {
  try {
    console.log(req.file.path)
    return res.json({status: true, message:"File uploded successfully"});
  } catch (error) {
    console.error(error);
  }
});


app.use(formData.parse({ uploadDir: os.tmpdir(), autoClean: true }));
app.use(cookieParser());
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use(cors({origin: '*'}));



app.use('/', indexRouter);
app.use('/auth', authMiddleware, authRouter);
app.use('/user', authMiddleware, userRouter);
// app.post('/upload',  async (req, res, nest) => {
//   const image = fs.readFileSync(req.files.fileData.path);
//   const img = 'data:image/jpeg;charset=utf-8;base64,' + image.toString('base64');
//   fs.writeFile
//   console.log(req.files)
// });
app.use('/scan', authMiddleware, scanRouter);
app.use('/payment', authMiddleware, paymentRouter);

app.use(function(err, req, res, next) {
  if (err instanceof ValidationError) {
    let errors = [];
    if (err.details.body) {
      err.details.body.map((item, index) => {
        errors.push({
          key: item.context.key,
          message: item.message 
        });
      });
    }
    if (err.details.params) {
      err.details.params.map((item, index) => {
        errors.push({
          key: item.context.key,
          message: item.message
        });
      });
    }
    if (err.details.query) {
      err.details.query.map((item, index) => {
        errors.push({
          key: item.context.key,   
          message: item.message
        });
      });
    }

    return res.status(200).json({
      status: false,
      errorCode: "Error_InvalidRequest",
      data: errors,
    });
  }

  console.error(err.message);
  return res.status(500).json(err);
});
/** ---------------------------------------- */

/**
 * MySQL Connection Config
 */
var sequelize = require('./src/common/sequelize');

const User = require('./src/models/user');

sequelize.authenticate().then(function() {
  console.info("MySQL: Connection has been established successfully.");

 
 
  // sequelize.sync({alter: true}).then(function() {
    console.info("MySQL: All models have been synchnorized successfully.");
  // });
}).catch(function(error) {
  console.error("Database connection error: ", error);
});
/** ---------------------------------------- */

module.exports = app;        