var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var formData = require('express-form-data');
var logger = require('morgan');
var { Sequelize } = require('sequelize');
var { ValidationError } = require('express-validation');
var os = require('os');
var cors = require('cors');
require('dotenv').config();

/**
 * Routes
 */
const indexRouter = require('./src/routes/index');
const authRouter = require('./src/controllers/auth');
const userRouter = require('./src/controllers/user_controller');
const uploadRouter = require('./src/controllers/upload_controller');

const authMiddleware = require('./src/middlewares/auth_middleware');
/** ---------------------------------------- */

/**
 * Express App Config
 */
var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(formData.parse({ uploadDir: os.tmpdir(), autoClean: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({origin: '*'}));

app.use('/', indexRouter);
app.use('/auth', authMiddleware, authRouter);
app.use('/user', authMiddleware, userRouter);
app.use('/upload', authMiddleware, uploadRouter);

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