const envManager = require('./env.js');
const actionManager = require('./action.js');

module.exports = {
  draw: async () => {
    const environments = await envManager.getEnvironments()
    const actions = await actionManager.getActions()
    let html = '<h2 class="mt-8">ENVIRONMENTS</h2>'
    for (let index = 0; index < environments.length; index++) {
      const env = environments[index];
      const hasLogs = !!env.logs && env.logs.length > 0
      const status =  hasLogs ? env.logs[0].status : 0;
      const lastRun = hasLogs ? parseInt(env.logs[0].date) : null;
      html += `<div class="flex-column mx-4 list-item">
                <div class="flex pa-8 ${status > 0 ? 'status-error' : 'status-ok'}" >
                  <div class="align-self-start pr-8 ${status > 0 ? 'text-error' : 'text-ok'}">${status > 0 ? 'Failed' : 'Active'}</div>
                  <div class="flex flex-max justify-spaceAround align-center">
                    <div>${env.name.toUpperCase()}</div>
                    <div>${!!lastRun ?
                      `Last update: <span class="link" onclick="showLog('${env.name}', ${lastRun}, ${status}${env.bot  !== undefined ? ', ' + env.bot : ''})">${new Date(lastRun).toLocaleDateString()} ${new Date(lastRun).toLocaleTimeString()}</span>` :
                      'Not updated yet'}
                    </div>
                    <div
                      class="btn white-blue ${status === -1 ? 'btn-disabled' : ''}"
                      onclick="updateEnv('${env.name}', ${status}${env.bot  !== undefined ? ', ' + env.bot : ''})">${status === -1 ? 'Running' : 'Update'}
                    </div>
                  </div>
                </div>
              </div>`
    }
    html += '<h2 class="mt-8">ACTIONS</h2><div class="flex">'
    for (let index = 0; index < actions.length; index++) {
      const action = actions[index];
      html += `<div
                  class="btn white-blue mx-4"
                  onclick="triggerAction('${action.name}', ${action.bot})">${action.name}
                </div>`
    }
    html += '</div>'
    return html
  }
}