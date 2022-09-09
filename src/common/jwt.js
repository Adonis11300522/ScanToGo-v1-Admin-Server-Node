const jwt = require('jsonwebtoken');
const secret = process.env.JWT_AUTH_KEY;

const AuthToken = {
  generate: function(email, password) {
    var token = jwt.sign(
      {
        email: email,
        password: password,
        at: new Date().getTime()
      },
      secret
    );

    return token;
  },
  verify: function(token) {
    try {
      var decoded = jwt.verify(token, secret);

      return {
        status: true,
        payload: decoded
      };
    }
    catch(err) {
      return {
        status: false,
        payload: err
      };
    }
  }
};

const APIToken = {

};

module.exports.AuthToken = AuthToken;