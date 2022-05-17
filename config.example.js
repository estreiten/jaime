module.exports = {
  auth: {
    pass: 'password',
    token: 'long_token_string'
  },
  hook: {
    port: 4000  //optional
  },
  env: {
    name: {
      branch: 'branch-name',
      branchStart: true, //only if you compare only the start of the branch string
      path: '/project/path'
    }
  },
  port: 8888  //optional
}