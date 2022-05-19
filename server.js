const config = require('./config');
const hookListener = require('./push-hook.js');
const authService = require('./auth.js');
const envManager = require('./env.js');
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
    res.sendFile('index.html', {root: '.'})
  } catch (err) {
    console.error(err.message)
    res.sendStatus(500)
  }
})

app.get('/router', async (req, res) => {
  try {
    if (authorized(req)) {
      res.setHeader('view', 'board')
      res.send(board.draw())
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
      if (!!req.body.env && Object.keys(config.env).indexOf(req.body.env) > -1) {
        res.sendStatus(envManager.updateByEnvName(req.body.env) === 0 ? 200 : 500)
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
      if (!!req.query.env && !!req.query.date) {
        res.sendFile(envManager.getLogPath(req.query.env, req.query.date), {root: '.'})
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

const port = config.port || 80
app.listen(port, () => {
  console.log(`Jaime listening on ${port}`)
  hookListener.init()
})