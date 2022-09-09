const bcrypt = require('bcrypt');
const saltRounds = 8;

module.exports.generate = function(text) {
  return bcrypt.hash(text, saltRounds);
};

module.exports.verify = function(text, hash) {
  return bcrypt.compare(text, hash);
}