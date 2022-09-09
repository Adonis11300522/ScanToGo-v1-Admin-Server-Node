const AuthToken = require('../common/jwt').AuthToken;
const User = require('../models/user');

const createError = require('http-errors');

module.exports = async function (req, res, next) {
  try {
    let webToken = req.get('Authorization');
    let result = AuthToken.verify(webToken);

    if (result.status) {
      const email = result.payload.email;
      const user = await User.findOne({
        where: {
          email: email
        },
      });

      if (user) {
        req.auth = user;
      }
    }

    next();
  }
  catch(e) {
    next(createError(500));
  }
};