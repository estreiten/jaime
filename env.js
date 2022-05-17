const fs = require('fs');
const { spawnSync } = require("child_process");
const util = require('./utils.js')


const getEnv = (branch) => {
  const environments = require('./config').env;
  for (const envName in environments) {
    if (Object.hasOwnProperty.call(environments, envName)) {
      let env = environments[envName];
      const hasBranch = env.branchStart ? branch.startsWith(env.branch) : branch === env.branch
      if (hasBranch) {
        env.name = envName
        return env
      }
    }
  }
  return false
}

const runScript = (step, {env, branch, logFile}) => {
  const name = step === 'post' ? 'post-build' : step
  const scriptFile = step === 'update' ? `${__dirname}/update.sh` : `${__dirname}/env/${env.name}/${step}.sh`
  if (fs.existsSync(scriptFile)) {
    log(logFile, `===== ${env.name} environment ${name} started =====`)
    const process = spawnSync(scriptFile, [branch], {cwd: env.path})
    if (process.stdout && process.stdout.length > 0) {
      log(logFile, `${process.stdout}`)
    }
    if (process.stderr && process.stderr.length > 0) {
      log(logFile, `== Stderr == \r\n${process.stderr}`)
    }
    if (process.error) {
      log(logFile, `error ${process.error.name}: ${process.error.message}`)
    }
    log(logFile, `The ${env.name} environment ${name} process ${process.status === 0 ? 'succeded' : 'failed'}`)
    return process.status
  } else {
    log(logFile, `No ${env.name} environment ${name} script was found`)
    return 0
  }
}

const log = (file, txt) => {
  let line = `${util.formatDate(new Date())}  `
  line += txt ? txt + '\n' : '\n'
  fs.writeFileSync(file, line, {
    flag: 'a+'
  });
}

module.exports = {
  update: (branch) => {
    const env = getEnv(branch)
    if (env) {
      const logFile = `${__dirname}/env/${env.name}/logs/${(new Date()).getTime()}.log`
      let status = runScript('update', {env, branch, logFile})
      if (status === 0) {
        status = runScript('build', {env, branch, logFile})
      }
      if (status === 0) {
        status = runScript('post', {env, branch, logFile})
      }
      if (status === 0) {
        log(logFile, `===== The ${env.name} environment has been updated =====`)
      } else {
        log(logFile, `===== The ${env.name} environment update failed =====`)
      }
    } else {
      console.log(`No environment is connected to the ${branch} branch`)
    }
  }
}