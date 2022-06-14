const util = require('./utils.js')
const config = require('./config.js').bots
let botsInfo = null

const getInfo = async () => {
  let info = { envs: [], actions: []}
  try {
    if (config) {
      for (let index = 0; index < config.length; index++) {
        const botConfig = config[index];
        resp = await util.request({
          hostname: botConfig.host,
          port: botConfig.port,
          path: `/?token=${botConfig.token}`,
          method: 'GET',
        })
        const botInfo = JSON.parse(resp)
        if (botInfo.env.length > 0) {
          const botEnvs = botInfo.env.map(env => {
            env.bot = index
            return env
          })
          info.envs = info.envs.concat(botEnvs)
        }
        if (botInfo.actions.length > 0) {
          const botActions = botInfo.actions.map(action => {
            return {
              name: action.name,
              key: action.key,
              logs: action.logs,
              bot: index
            }
          })
          info.actions = info.actions.concat(botActions)
        }
      }
    }
  } catch (error) {
    console.error('Bot error', error)
  } finally {
    return info
  }
}

module.exports = {
  getConfig: (botIndex) => {
    if (botIndex < config.length) {
      return config[botIndex]
    } else {
      return null
    }
  },
  getEnvironments: async () => {
    botsInfo = await getInfo()
    return botsInfo.envs
  },
  getActions: async () => {
    botsInfo = await getInfo()
    return botsInfo.actions
  },
  getLog: (botIndex, key, date, type) => {
    if (botIndex < config.length) {
      const botConfig = config[botIndex]
      return util.request({
        hostname: botConfig.host,
        port: botConfig.port,
        path: `/log?token=${botConfig.token}&${type}=${key}&date=${date}`,
        method: 'GET',
      })
    } else {
      return null
    }
  },
  updateEnv: async (botIndex, envName, branch) => {
    return new Promise((resolve) => {
      if (botIndex < config.length) {
        const botConfig = config[botIndex]
        let data = { env: envName }
        if (!!branch) {
          data.branch = branch
        }
        const req = util.request({
          hostname: botConfig.host,
          port: botConfig.port,
          path: `/update?token=${botConfig.token}`,
          method: 'POST',
          data
        })
        req.then(() => { resolve(200) })
          .catch((err) => {
            console.error(err)
            resolve(500)
          })
      } else {
        resolve(200)
      }
    })
  },
  executeAction: async (botIndex, actionKey) => {
    return new Promise((resolve) => {
      if (botIndex < config.length) {
        const botConfig = config[botIndex]
        const req = util.request({
          hostname: botConfig.host,
          port: botConfig.port,
          path: `/action?token=${botConfig.token}`,
          method: 'POST',
          data: { key: actionKey }
        })
        req.then(() => { resolve(200) })
          .catch((err) => {
            console.error(err)
            resolve(500)
          })
      } else {
        resolve(200)
      }
    })
  }
}