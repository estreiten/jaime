const util = require('./utils.js')
const config = require('./config.js').bots

module.exports = {
  getConfig: (botIndex) => {
    if (botIndex < config.length) {
      return config[botIndex]
    } else {
      return null
    }
  },
  getEnvironments: async () => {
    let envs = []
    for (let index = 0; index < config.length; index++) {
      const botConfig = config[index];
      let botEnvs = await util.request({
        hostname: botConfig.host,
        port: botConfig.port,
        path: `/?token=${botConfig.token}`,
        method: 'GET',
      })
      botEnvs = JSON.parse(botEnvs).map(env => {
        env.bot = index
        return env
      })
      envs = envs.concat(botEnvs)
    }
    return envs
  },
  getLog: (botIndex, envName, date) => {
    if (botIndex < config.length) {
      const botConfig = config[botIndex]
      return util.request({
        hostname: botConfig.host,
        port: botConfig.port,
        path: `/log?token=${botConfig.token}&env=${envName}&date=${date}`,
        method: 'GET',
      })
    } else {
      return null
    }
  },
  updateEnv: (botIndex, envName, branch) => {
    if (botIndex < config.length) {
      const botConfig = config[botIndex]
      let data = { env: envName }
      if (!!branch) {
        data.branch = branch
      }
      return util.request({
        hostname: botConfig.host,
        port: botConfig.port,
        path: `/update?token=${botConfig.token}`,
        method: 'POST',
        data
      })
    } else {
      return null
    }
  }
}