module.exports = {
  // name: 'My Server',
  auth: {
    pass: 'password',
    token: 'long_token_string'
  },
  hook: {
    port: 4000  //optional
  },
  /*
  smtp: {
    host: 'mail.host',
    port: 587,
    auth: {
      user: 'mail_user',
      pass: 'mail_pass'
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  env: {
    name: {
      branch: 'branch-name',
      branchStart: true, //only if you compare only the start of the branch string
      path: '/project/path'
    }
  },
  actions: [{
    name: 'Trigger this action',
    key: 'action-key'
  }],
  bots: [{
    host: 'localhost',
    port: '8282',
    token: 'another_long_string'
  }],
  port: 8888  //optional
  */
}