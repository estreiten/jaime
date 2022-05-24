const envManager = require('./env.js')
const util = require('./utils.js')

module.exports = {
  init: () => {
    const config = require('./config').hook;
    const express = require('express');
    const app = express();

    app.use(express.json({extended: true}))
    app.use(express.urlencoded({extended: true}))

    app.post('/', async (req, res) => {
      try {
        console.log('\n' + util.formatDate(new Date()))
        console.log('post received')
        if (req.body.ref.startsWith('refs/heads/')) {
          const branch = req.body.ref.substring(11)
          console.log(`${branch} branch update detected`)
          await envManager.updateByBranch(branch)
          console.log(`${branch} branch processing finished`)
          console.log(util.formatDate(new Date()))
        }
        res.sendStatus(200)
      } catch (err) {
        console.error(err.message)
        res.sendStatus(500)
      }
    })

    const port = config.port || 4000
    app.listen(port, () => {
      console.log(`Github push hook listening on ${port}`)
    })
  }
}