const fs = require('fs');
const { spawn } = require("child_process");

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

const runScript = (step, {env, branch, logFile, logStream}) => {
  const name = step === 'post' ? 'post-build' : step
  const scriptFile = step === 'update' ? `${__dirname}/update.sh` : `${__dirname}/env/${env.name}/${step}.sh`
  if (fs.existsSync(scriptFile)) {
    log(logFile, `${env.name} environment ${name} started`)
    const process = spawn(scriptFile, [branch], {cwd: env.path})
    process.stdout.pipe(logStream)
    process.stderr.pipe(logStream)
    process.on('close', code => {
      return code
    })
  } else {
    log(logFile, `No ${env.name} environment ${name} script was found`)
  }
}

const formatDate = (date) => {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}

const log = (file, txt) => {
  let line = `${formatDate(new Date())}  `
  line += txt ? txt + '\n' : '\n'
  fs.writeFileSync(file, line, {flag: 'a+'});
}

module.exports = {
  init: () => {
    const config = require('./config').hook;
    const express = require('express');
    const app = express();

    app.use(express.json({
      extended: true
    }))
    app.use(express.urlencoded({
      extended: true
    }))

    app.post('/', async (req, res) => {
      try {
        console.log('\n' + formatDate(new Date()))
        console.log('post received')
        if (req.body.ref.startsWith('refs/heads/')) {
          const branch = req.body.ref.substring(11)
          console.log(`${branch} branch update detected`)
          const env = getEnv(branch)
          if (env) {
            const logFile = `${__dirname}/env/${env.name}/logs/${(new Date()).getTime()}.log`
            const logStream = fs.createWriteStream(logFile, { flags: 'a' });
            runScript('update', {env, branch, logFile, logStream})
            runScript('build', {env, branch, logFile, logStream})
            runScript('post', {env, branch, logFile, logStream})
            log(logFile, `The ${env.name} environment has been updated`)
          } else {
            console.log(`No environment is connected to the ${branch} branch`)
          }
          console.log(`${branch} branch processing finished`)
          console.log(formatDate(new Date()))
        }
        res.sendStatus(200)
      } catch (err) {
        console.error(err.message)
      }
    })

    const port = config.port || 80
    app.listen(port, () => {
      console.log(`listening on ${port}`)
    })
  }
}