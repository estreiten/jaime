module.exports = {
  hook: {
    port: 4000
  },
  env: {
    name: {
      branch: 'branch-name',
      branchStart: true, //only if you compare only the start of the branch string
      path: '/project/path'
    }
  }
}