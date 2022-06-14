const envManager = require('./env.js');
const actionManager = require('./action.js');

module.exports = {
  draw: async () => {
    const environments = await envManager.getEnvironments()
    const actions = await actionManager.getActions()
    let isRunning = false
    let html = '<h2 class="mt-8">ENVIRONMENTS</h2>'
    for (let index = 0; index < environments.length; index++) {
      const env = environments[index];
      const hasLogs = !!env.logs && env.logs.length > 0
      const status =  hasLogs ? env.logs[0].status : 0
      if (status === -1) {
        isRunning = true
      }
      const lastRun = hasLogs ? parseInt(env.logs[0].date) : null
      html += `<div class="flex-column mx-4 list-item">
                <div class="flex pa-8 ${status > 0 ? 'status-error' : status == 0 ? 'status-ok' : 'status-running'}" >
                  <div class="align-self-start pr-8 ${status > 0 ? 'text-error' : status == 0 ? 'text-ok' : 'text-running'}">
                    ${status > 0 ? 'Failed' : status == 0 ? 'Active' : 'Running'}
                  </div>
                  <div class="flex flex-max justify-spaceAround align-center">
                    <div>${env.name.toUpperCase()}</div>
                    <div>${!!lastRun && (status > -1) ?
                      `Last update: <span class="link date" onclick="showLog('env', '${env.name}', ${lastRun}, ${status}${env.bot  !== undefined ? ', ' + env.bot : ''})">${lastRun}</span>` :
                      'Not updated yet'}
                    </div>
                    <div
                      class="btn white-blue ${status === -1 ? 'btn-disabled' : ''}"
                      onclick="updateEnv(this, '${env.name}'${env.bot  !== undefined ? ', ' + env.bot : ''})">${status === -1 ? 'Running' : 'Update'}
                    </div>
                  </div>
                </div>
              </div>`
    }
    html += '<h2 class="mt-8">ACTIONS</h2><div class="flex">'
    for (let index = 0; index < actions.length; index++) {
      const action = actions[index];
      const hasLogs = !!action.logs && action.logs.length > 0
      const status = hasLogs ? action.logs[0].status : 0
      if (status === -1) {
        isRunning = true
      }
      const lastRun = hasLogs ? parseInt(action.logs[0].date) : null
      html += `<div class="flex-column mx-4 list-item">
                <div class="flex pa-8 ${status > 0 ? 'status-error' : status == 0 ? 'status-ok' : 'status-running'}" >
                  <div class="flex flex-max justify-spaceAround align-center">
                    <div
                      class="btn white-blue ${status === -1 ? 'btn-disabled' : ''}"
                      onclick="triggerAction(this, '${action.key}'${action.bot  !== undefined ? ', ' + action.bot : ''})">${action.name.toUpperCase()}
                    </div>
                    <div class="action-status">${status === -1 ? 'Running' :
                      !!lastRun ? `Last run: <span class="link date" onclick="showLog('action', '${action.key}', ${lastRun}, ${status}${action.bot  !== undefined && action.bot !== null ? ', ' + action.bot : ''})">${lastRun}</span>` :
                      'Not run yet'}
                    </div>
                  </div>
                </div>
              </div>`
    }
    html += '</div>'
    if (isRunning) {
      html += '<script>setTimeout(location.reload, 1000 * 60 * 5)</script>'
    }
    return html
  }
}
