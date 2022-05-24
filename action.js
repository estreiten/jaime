const fs = require('fs');
const { spawnSync } = require("child_process");
const actions = require('./config').actions;
const botManager = require('./bot.js');

module.exports = {
  getActions: async () => {
    const myActions = actions ? actions.map(action => {
      return {
        name: action.name,
        bot: null
      }
    }) : []
    const botActions = await botManager.getActions()
    return myActions.length > 0 ? myActions.concat(botActions) : botActions
  },
  execute: (actionName) => {
    const action = actions.find(action => action.name === actionName)
    if (action) {
      const scriptFile = `${__dirname}/actions/${action.script}`
      if (fs.existsSync(scriptFile)) {
        const process = spawnSync(scriptFile)
        return process.status
      } else {
        return 0
      }
    } else {
      return -1
    }
  }
}