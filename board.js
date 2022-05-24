const envManager = require('./env.js');

module.exports = {
  draw: async () => {
    const environments = await envManager.getEnvironments()
    let html = '<div class="flex-column list-item">'
    for (let index = 0; index < environments.length; index++) {
      const env = environments[index];
      const hasLogs = !!env.logs && env.logs.length > 0
      const status =  hasLogs ? env.logs[0].status : 0;
      const lastRun = hasLogs ? parseInt(env.logs[0].date) : null;
      html += `<div class="flex pa-8 ${status > 0 ? 'status-error' : 'status-ok'}">
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
              </div>`
    }
    html += '</div>'
    return html
  }
}