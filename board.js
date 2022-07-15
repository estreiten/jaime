const envManager = require('./env.js');
const actionManager = require('./action.js');

module.exports = {
  draw: async () => {
    const environments = await envManager.getEnvironments()
    const actions = await actionManager.getActions()
    const actionsByGroup = actions.groupBy('group').undefinedFirst()
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
                    <div class="text-center">${!!lastRun && (status > -1) ?
                      `Last update: <span class="link date" onclick="showLog('env', '${env.name}', ${lastRun}, ${status}${env.bot  !== undefined ? ', ' + env.bot : ''})">${lastRun}</span>` :
                      'Not updated yet'}<br>
                      ${!!hasLogs ? `<span class="link" onclick="listLogs('env', '${env.name}'${env.bot  !== undefined && env.bot !== null ? ', ' + env.bot : ''})">Previous updates</span>` : ''}
                    </div>
                    <div
                      class="btn white-blue ${status === -1 ? 'btn-disabled' : ''}"
                      onclick="updateEnv(this, '${env.name}'${env.bot  !== undefined ? ', ' + env.bot : ''})">${status === -1 ? 'Running' : 'Update'}
                    </div>
                  </div>
                </div>
              </div>`
    }
    const hasUndefinedGroup = Object.keys(actionsByGroup)[0] === 'undefined'
    html += `<h2 class="mt-8${!hasUndefinedGroup ? ' mb-0' : ''}">ACTIONS</h2><div class="flex-column mx-2">`
    for (const group in actionsByGroup) {
      const groupActions = actionsByGroup[group];
      if (group !== 'undefined') {
        html += `<h3>${group}</h3>`
      }
      html += '<div class="flex flex-wrap">'
        for (let index = 0; index < groupActions.length; index++) {
          const action = groupActions[index];
          const hasLogs = !!action.logs && action.logs.length > 0
          const status = hasLogs ? action.logs[0].status : 0
          if (status === -1) {
            isRunning = true
          }
          const lastRun = hasLogs ? parseInt(action.logs[0].date) : null
          html += `<div class="flex-column mx-4 mb-4 list-item">
                    <div class="flex pa-8 flex-max ${status > 0 ? 'status-error' : status == 0 ? 'status-ok' : 'status-running'}" >
                      <div class="flex flex-max justify-spaceAround align-center">
                        <div
                          class="btn white-blue ${status === -1 ? 'btn-disabled' : ''}"
                          onclick="triggerAction(this, '${action.key}'${action.bot  !== undefined ? ', ' + action.bot : ''})">${action.name.toUpperCase()}
                        </div>
                        <div class="action-updates text-center"><div class="action-status">${status === -1 ? 'Running' :
                          !!lastRun ? `Last run: <span class="link date" onclick="showLog('action', '${action.key}', ${lastRun}, ${status}${action.bot  !== undefined && action.bot !== null ? ', ' + action.bot : ''})">${lastRun}</span>` :
                          'Not run yet'}</div>
                          ${!!hasLogs ? `<span class="link" onclick="listLogs('action', '${action.key}'${action.bot  !== undefined && action.bot !== null  ? ', ' + action.bot : ''})">Previous runs</span>` : ''}
                        </div>`

          if (!!action.cron) {
            html +=`    <div class="action-schedule">
                          <a href="https://github.com/node-cron/node-cron#allowed-fields" target="_blank">Schedule</a>: ${action.cron}
                          <div
                            class="btn icon white-blue ${status === -1 ? 'btn-disabled' : ''}"
                            onclick="toggleAction(this, '${action.key}'${action.bot  !== undefined ? ', ' + action.bot : ''})">${action.isPaused ? '▶' : '&#10074;&#10074;'}</div>
                        </div>`
          }

          html += `   </div>
                    </div>
                  </div>`
        }
      html += '</div>'
    }
    html += '</div>'
    if (isRunning) {
      html += '<script>setTimeout(location.reload, 1000 * 60 * 5)</script>'
    }
    return html
  }
}
