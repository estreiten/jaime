const fs = require('fs');
const cron = require('node-cron');
const serverName = require('./config').name;
const actions = require('./config').actions;
const { spawnScript, killScript } = require('./runner');
const botManager = require('./bot.js');
const notifierService = require('./notifier');

const log = (file, txt) => {
  let line = `${new Date().toUTCString()}\n`
  line += txt ? txt + '\n' : '\n'
  fs.writeFileSync(file, line, {
    flag: 'a+'
  });
}

const getActions = async () => {
  const myActions = actions ? actions.map(action => {
    let out = {
      name: action.name,
      key: action.key,
      notify: action.notify,
      logs: getLogs(action.key),
      cron: action.cron,
      bot: null
    }
    if (!!action.cron) {
      out.isPaused = isPaused(action.key)
    }
    if (!!serverName) {
      out.group = serverName
    }
    const paramsPath = `${__dirname}/actions/${action.key}/params.txt`
    if (fs.existsSync(paramsPath)) {
      const paramsFile = fs.readFileSync(paramsPath, 'utf8')
      out.params = paramsFile.split(/\r?\n/)
    }
    return out
  }) : []
  const botActions = await botManager.getActions()
  return myActions.length > 0 ? myActions.concat(botActions) : botActions
}

const afterScript = (code, logFile, logName, action, path, param, lock, runErrorHandler) => {
  const result = code === 0 ? 'succeded' : code === 10 ? 'succeded, re-run requested' : code === 3 ? 'succeded with warnings' : 'failed'
  log(logFile, `==== The "${action.name}" action script ${result} ====`)
  const newLog = `${logName}-${code === null ? 1 : code}.log`
  fs.renameSync(logFile, newLog)
  if (code === 10) {
    runScript(action, path, param)
    return
  }
  const finish = () => {
    fs.unlinkSync(lock)
    notifierService.notifyAction(code === 0 ? 'ok' : code === 3 ? 'warn' : 'fail', action, newLog)
  }
  if (runErrorHandler) {
    runErrorScript(action, path, newLog, finish)
  } else {
    finish()
  }
}

const errorHandler = (err, logFile) => {
  console.error(err)
  log(logFile, `== Error == \r\n${err.name}: ${err.message}`)
}

const runScript = async (action, path, param) => {
  const lock = `${path}/.lock`
  const scriptFile = `${path}/run.sh`
  const logName = `${path}/logs/${(new Date()).getTime()}`
  const logFile = `${logName}.log`
  if (fs.existsSync(scriptFile)) {
    log(logFile, `The "${action.name}" action script is starting`)
    let hasWarning = false
    let runErrorHandler = false
    const child = spawnScript(scriptFile, param ? [param] : [], action.root)
    const failAndKill = () => {
      runErrorHandler = true
      killScript(child)
    }
    child.stdout.on('data', data => {
      log(logFile, data)
    })
    child.stderr.on('data', data => {
      const errorRx = /error|fatal|failed|exception|critical/i
      const warnRx = /warning|deprecated|caution|notice/i
      let title = 'Stderr output'
      if (errorRx.test(data)) {
        title = 'Error'
        child.exitCode = 1
      } else if (warnRx.test(data)) {
        title = 'Warning'
        hasWarning = true
      }
      log(logFile, `== ${title} == \r\n${data}`)
      if (child.exitCode === 1) {
        failAndKill()
      }
    })
    child.on('close', code => {
      const finalCode = runErrorHandler ? 1 : (code === 0 && hasWarning ? 3 : code)
      afterScript(finalCode, logFile, logName, action, path, param, lock, runErrorHandler)
    })
    child.on('error', err => {
      errorHandler(err, logFile, logName, lock, action)
      child.exitCode = 1
      failAndKill()
    })
  } else {
    const nodeFile = `${path}/run.js`
    if (fs.existsSync(nodeFile)) {
      const run = require(nodeFile)
      const code = await run(log, logFile, param ? [param] : [])
      afterScript(code, logFile, logName, action, path, param, lock)
    } else {
      log(logFile, `No ${action.name} script was found`)
      fs.renameSync(logFile, `${logName}-0.log`)
      fs.unlinkSync(lock)
    }
  }
}

const runErrorScript = (action, path, logFile, done) => {
  const errorScript = `${path}/error.sh`
  if (!fs.existsSync(errorScript)) {
    return done()
  }
  let finished = false
  const finish = () => {
    if (!finished) {
      finished = true
      done()
    }
  }
  log(logFile, '== Error handling script output == start')
  const errorProcess = spawnScript(errorScript, [], action.root)
  errorProcess.stdout.on('data', data => log(logFile, data))
  errorProcess.stderr.on('data', data => log(logFile, `== Error handling script stderr ==\r\n${data}`))
  errorProcess.on('error', err => {
    log(logFile, `Error handling script could not run: ${err.message}`)
    finish()
  })
  errorProcess.on('close', () => {
    log(logFile, '== Error handling script output == end')
    finish()
  })
}

const execute = (actionKey, param, tries = 3) => {
  const action = actions.find(action => action.key === actionKey)
  if (action) {
    const path = `${__dirname}/actions/${action.key}`
    const lock = `${path}/.lock`
    if (fs.existsSync(lock)) {
      if (tries > 0) {
        setTimeout(() => {
          execute(action, --tries)
        }, 1000 * 60 * 10)
      } else {
        console.error(`Run aborted. The "${action.name}" action has been running a previous script for more than 30 minutes`)
      }
    } else {
      fs.closeSync(fs.openSync(lock, 'w'))
      runScript(action, path, param)
    }
  } else {
    console.log(`No action found with the key "${actionKey}"`)
  }
}

const toggle = (actionKey) => {
  const action = actions.find(action => action.key === actionKey)
  if (action) {
    const path = `${__dirname}/actions/${action.key}`
    const pause = `${path}/.pause`
    if (fs.existsSync(pause)) {
      fs.unlinkSync(pause)
    } else {
      fs.closeSync(fs.openSync(pause, 'w'))
    }
  } else {
    console.log(`No action found with the key "${actionKey}"`)
  }
}

const isPaused = (actionKey) => {
  const action = actions.find(action => action.key === actionKey)
  if (action) {
    const path = `${__dirname}/actions/${action.key}`
    const pause = `${path}/.pause`
    return fs.existsSync(pause)
  } else {
    console.log(`No action found with the key "${actionKey}"`)
    return false
  }
}

const getLogs = (actionKey) => {
  let logs = []
  const logsPath = `${__dirname}/actions/${actionKey}/logs`
  const logFiles = fs.readdirSync(logsPath)
  for (let index = 0; index < logFiles.length; index++) {
    const logFile = logFiles[index];
    const separator = logFile.indexOf('-');
    const ext = logFile.indexOf('.log');
    logs.push({
      date: separator > -1 ? logFile.substring(0, separator) : logFile.substring(0, ext),
      status: separator > -1 ? logFile.substring(separator + 1, ext) : -1
    })
  }
  return logs.sort((logA, logB) => logB.date - logA.date)
}

module.exports = {
  getActions,
  execute,
  toggle,
  getLogPath: (actionKey, date) => {
    const logsPath = `${__dirname}/actions/${actionKey}/logs`
    const logFiles = fs.readdirSync(logsPath)
    const logFile = logFiles.find(logFile => logFile.startsWith(date))
    return `actions/${actionKey}/logs/${logFile}`
  },
  getLogList: (actionKey) => {
    const logsPath = `${__dirname}/actions/${actionKey}/logs`
    const logFiles = fs.readdirSync(logsPath)
    return logFiles.map(logFile => logFile.substring(0, logFile.length-4))  //remove file extension
  },
  isPaused,
  initScheduler: async () => {
    const actions = await getActions()
    const cronActions = actions.filter(action => !!action.cron)
    console.log('actions schedule', cronActions)
    for (let index = 0; index < cronActions.length; index++) {
      const action = cronActions[index];
      cron.schedule(action.cron, () => {
        if (action.bot !== null) {
          botManager.isActionPaused(action.bot, action.key).then(isPaused => {
            if (isPaused === 'false') {
              botManager.executeAction(action.bot, action.key, 0)
            }
          })
        } else {
          if (!isPaused(action.key)) {
            execute(action.key, 0) //don't retry if locked
          }
        }
      });
    }
  }
}