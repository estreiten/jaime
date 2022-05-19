const envManager = require('./env.js');

module.exports = {
  draw: () => {
    const environments = envManager.getEnvironments()
    let html = '<div class="flex-column">'
    for (let index = 0; index < environments.length; index++) {
      const env = environments[index];
      const hasLogs = !!env.logs && env.logs.length > 0
      const status =  hasLogs ? env.logs[0].status : 0;
      const lastRun = hasLogs ? parseInt(env.logs[0].date) : null;
      html += `<div class="flex justify-spaceAround align-center pa-8 ${status > 0 ? 'status-error' : 'status-ok'}">
                <div>${env.name.toUpperCase()}</div>
                <div>${!!lastRun ?
                  `Last update: <span class="link" onclick="showLog('${env.name}', ${lastRun}, ${status})">${new Date(lastRun).toLocaleDateString()} ${new Date(lastRun).toLocaleTimeString()}</span>` :
                  'Not updated yet'}
                </div>
                <div
                  class="btn white-blue ${status === -1 ? 'btn-disabled' : ''}"
                  onclick="updateEnv('${env.name}', ${status})">${status === -1 ? 'Running' : 'Update'}
                </div>
              </div>`
    }
    html += '</div>'
    return html
  }
}