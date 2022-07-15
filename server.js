const fs = require('fs');
const config = require('./config');
const hookListener = require('./push-hook.js');
const authService = require('./auth.js');
const envManager = require('./env.js');
const botManager = require('./bot.js');
const actionManager = require('./action.js');
const board = require('./board.js');

const express = require('express');
const app = express();

app.use(express.json({extended: true}))
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))

const authorized = (req) => {
  const token = req.headers['token']
  return !config.auth || !config.auth.token || token === config.auth.token
}

app.get('/', async (req, res) => {
  try {
    const tab = !!config.brand && !!config.brand.tab ? config.brand.tab : 'Jaime'
    const title = !!config.brand && !!config.brand.title ? config.brand.title : 'Jaime Task Manager'
    let html = fs.readFileSync('index.html', 'utf8');
    html = html.replace('{{tab}}', tab)
    html = html.replace('{{title}}', title)
    res.send(html)
  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
})

app.get('/router', async (req, res) => {
  try {
    if (authorized(req)) {
      res.setHeader('view', 'board')
      const html = await board.draw()
      res.send(html)
    } else {
      res.setHeader('view', 'login')
      res.sendFile('views/login.html', {root: '.'})
    }
  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
})

app.post('/login', async (req, res) => {
  try {
    if (!authorized(req)) {
      if (authService.login(req.body.pass)) {
        res.send(config.auth.token).status(200)
      } else {
        res.sendStatus(403)
      }
    } else {
      res.redirect('/')
    }
  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
})

app.post('/update', async (req, res) => {
  try {
    console.log('update trigger received for', req.body.env)
    if (authorized(req)) {
      if (!!req.body.env) {
        if (req.body.bot === undefined) {
          if (Object.keys(config.env).indexOf(req.body.env) > -1) {
            envManager.updateByEnvName(req.body.env)
            res.sendStatus(200)
          } else {
            res.sendStatus(400)
          }
        } else {
          const status = await botManager.updateEnv(req.body.bot, req.body.env)
          res.sendStatus(status)
        }
      } else {
        res.sendStatus(400)
      }
    } else {
      res.redirect('/')
    }
  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
})

app.get('/log', async (req, res) => {
  try {
    if (authorized(req)) {
      if ((!!req.query.env || !!req.query.action) && !!req.query.date) {
        if (req.query.bot !== undefined) {
          const type = !!req.query.env ? 'env' : 'action'
          const key = type === 'env' ? req.query.env : req.query.action
          const log = await botManager.getLog(req.query.bot, key, req.query.date, type)
          res.send(log)
        } else {
          const manager = !!req.query.env ? envManager : actionManager
          const key = !!req.query.env ? req.query.env : req.query.action
          const path = manager.getLogPath(key, req.query.date)
          res.sendFile(path, {root: '.'})
        }
      } else {
        res.sendStatus(400)
      }
    } else {
      res.sendStatus(403)
    }
  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
})

app.get('/logs', async (req, res) => {
  try {
    if (authorized(req)) {
      if (!!req.query.env || !!req.query.action) {
        if (req.query.bot !== undefined) {
          const type = !!req.query.env ? 'env' : 'action'
          const key = type === 'env' ? req.query.env : req.query.action
          const list = await botManager.getLogList(req.query.bot, key, type)
          res.send(list)
        } else {
          const manager = !!req.query.env ? envManager : actionManager
          const key = !!req.query.env ? req.query.env : req.query.action
          const list = manager.getLogList(key)
          res.send(list)
        }
      } else {
        res.sendStatus(400)
      }
    } else {
      res.sendStatus(403)
    }
  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
})

app.post('/action', async (req, res) => {
  try {
    console.log('action trigger received for', req.body.key)
    if (authorized(req)) {
      if (!!req.body.key) {
        if (req.body.bot === undefined) {
          if (config.actions.some(action => action.key === req.body.key)) {
            actionManager.execute(req.body.key)
            res.sendStatus(200)
          } else {
            res.sendStatus(400)
          }
        } else {
          const status = await botManager.executeAction(req.body.bot, req.body.key)
          res.sendStatus(status)
        }
      } else {
        res.sendStatus(400)
      }
    } else {
      res.redirect('/')
    }
  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
})

app.post('/toggle', async (req, res) => {
  try {
    console.log('toggle action received for', req.body.key)
    if (authorized(req)) {
      if (!!req.body.key) {
        if (req.body.bot === undefined) {
          if (config.actions.some(action => action.key === req.body.key && !!action.cron)) {
            actionManager.toggle(req.body.key)
            res.sendStatus(200)
          } else {
            res.sendStatus(400)
          }
        } else {
          const status = await botManager.toggleAction(req.body.bot, req.body.key)
          res.sendStatus(status)
        }
      } else {
        res.sendStatus(400)
      }
    } else {
      res.redirect('/')
    }
  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
})

const port = config.port || 80
app.listen(port, () => {
  console.log(`Jaime listening on ${port}`)
  actionManager.initScheduler()
  hookListener.init()
})