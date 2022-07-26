const fs = require('fs');
const os = require('os');
const { spawn } = require("child_process");
const botManager = require('./bot.js');
const util = require('./utils.js');
const notifierService = require('./notifier');
const environments = require('./config').env;

const getEnvironments = async () => {
  let envs = []
  for (const envName in environments) {
    if (Object.hasOwnProperty.call(environments, envName)) {
      let env = environments[envName];
      env.name = envName
      env.logs = getEnvLogs(envName)
      envs.push(env)
    }
  }
  const botEnvs = await botManager.getEnvironments()
  return envs.concat(botEnvs)
}

const getEnvByName = (name) => {
  for (const envName in environments) {
    if (Object.hasOwnProperty.call(environments, envName)) {
      if (name === envName) {
        let env = environments[envName];
        env.name = envName
        return env
      }
    }
  }
  return false
}

const getEnvByBranch = async (branch) => {
  const envs = await getEnvironments()
  for (let index = 0; index < envs.length; index++) {
    const env = envs[index];
    const hasBranch = env.branchStart ? branch.startsWith(env.branch) : branch === env.branch
    if (hasBranch && env.auto !== false) {
      return env
    }
  }
  return false
}

const runScript = (step, {env, branch, logName, lock}, next) => {
  const name = step === 'post' ? 'post-build' : step
  const scriptFile = step === 'update' ? `${__dirname}/update.sh` : `${__dirname}/env/${env.name}/${step}.sh`
  const logFile = `${logName}.log`
  const params = branch ? [branch, logFile] : [logFile]
  if (fs.existsSync(scriptFile)) {
    log(logFile, `===== ${env.name} environment ${name} started =====`)
    const isWin = os.platform() === "win32"
    const spawnParams = isWin ? { shell: true } : {}
    if (env.path) {
      spawnParams.cwd = env.path
    }
    const process = spawn(scriptFile, params, spawnParams)
    process.stdout.on('data', data => {
      log(logFile, data)
    })
    process.stderr.on('data', data => {
      log(logFile, `== Stderr == \r\n${data}`)
    })
    process.on('close', code => {
      log(logFile, `The ${env.name} environment ${name} process ${code === 0 ? 'succeded' : 'failed'}`)
      if (code === 0) {
        if (next && next.length > 0) {
          runScript(next.shift(), {env, branch, logName, lock}, next)
        } else {
          log(logFile, `===== The ${env.name} environment has been updated =====`)
          const newLog = `${logName}-${code === null ? 1 : code}.log`
          fs.renameSync(logFile, newLog)
          if (branch) {
            console.log(`${branch} branch processing finished`)
          }
          fs.unlinkSync(lock)
          notifierService.notifyEnv('ok', env, branch, newLog)
        }
      } else {
        log(logFile, `===== The ${env.name} environment update failed =====`)
        const newLog = `${logName}-${code === null ? 1 : code}.log`
        fs.renameSync(logFile, newLog)
        fs.unlinkSync(lock)
        notifierService.notifyEnv('fail', env, branch, newLog)
      }
    })
    process.on('error', err => {
      log(logFile, `error ${err.name}: ${err.message}`)
      const newLog = `${logName}-1.log`
      fs.renameSync(logFile, newLog)
      fs.unlinkSync(lock)
      notifierService.notifyEnv('fail', env, branch, newLog)
    })
  } else {
    log(logFile, `No ${env.name} environment ${name} script was found`)
    log(logFile, `===== The ${env.name} environment has been updated =====`)
    const newLog = `${logName}-0.log`
    fs.renameSync(logFile, newLog)
    if (branch) {
      console.log(`${branch} branch processing finished`)
    }
    fs.unlinkSync(lock)
    notifierService.notifyEnv('ok', env, branch, newLog)
  }
}

const log = (file, txt) => {
  let line = `${new Date().toUTCString()}\n`
  line += txt ? txt + '\n' : '\n'
  fs.writeFileSync(file, line, {
    flag: 'a+'
  });
}

const update = (env, branch, tries = 3) => {
  if (env) {
    const path = `${__dirname}/env/${env.name}`
    const lock = `${path}/.lock`
    if (fs.existsSync(lock)) {
      if (tries > 0) {
        setTimeout(() => {
          update(env, branch, --tries)
        }, 1000 * 60 * 10)
      } else {
        console.error(`Run aborted. The ${env.name} environment has been running a previous script for more than 30 minutes`)
      }
    } else {
      fs.closeSync(fs.openSync(lock, 'w'))
      const logName = `${path}/logs/${(new Date()).getTime()}`
      runScript('update', {env, branch, logName, lock}, ['build','post'])
    }
  } else {
    console.log(`No environment is connected to the ${branch} branch`)
  }
}

const getEnvLogs = (envName) => {
  let logs = []
  const logsPath = `${__dirname}/env/${envName}/logs`
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
  getEnvironments,
  updateByEnvName: (envName) => {
    const env = getEnvByName(envName)
    update(env)
  },
  updateByBranch: async (branch) => {
    const env = await getEnvByBranch(branch)
    if (env.bot !== undefined && env.bot !== null) {
      botManager.updateEnv(env.bot, env.name, branch)
    } else {
      update(env, branch)
    }
  },
  getLogPath: (env, date) => {
    const logsPath = `${__dirname}/env/${env}/logs`
    const logFiles = fs.readdirSync(logsPath)
    const logFile = logFiles.find(logFile => logFile.startsWith(date))
    return `env/${env}/logs/${logFile}`
  },
  getLogList: (env) => {
    const logsPath = `${__dirname}/env/${env}/logs`
    const logFiles = fs.readdirSync(logsPath)
    return logFiles.map(logFile => logFile.substring(0, logFile.length-4))  //remove file extension
  }
}