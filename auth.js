const auth = require('./config').auth;

module.exports = {
  login (pass) {
    return (pass === auth.pass) ? auth.token : null
  }
}