const envManager = require('./env.js');
const actionManager = require('./action.js');

const getStatusTxt = (status) => {
  const statInt = parseInt(status)
  switch (statInt) {
    case 0: return 'success'
    case -2: return 'new'
    case -1: return 'progress'
    default: return 'error'
  }
}

const environmentsHtml = async () => {
  const environments = await envManager.getEnvironments()
  let html = '<div class="flex flex-wrap">'
  let isRunning = false
  for (let index = 0; index < environments.length; index++) {
      const env = environments[index];
      const hasLogs = !!env.logs && env.logs.length > 0
      const status =  hasLogs ? env.logs[0].status : -2
      const statusTxt = getStatusTxt(status)
      if (status === -1) {
        isRunning = true
      }
      html += `<div class="flex-column mr-4 mb-2 py-2 px-4 list-item align-center bg-${statusTxt}">
                <div class="title full-width text-center header">${env.name.toUpperCase()}</div>
                  <div class="text-center">`;
      if (env.logs.length === 0) {
        html += 'Not updated yet'
      } else {
        for (let index = 0; index < env.logs.length && index < 3; index++) {
          const log = env.logs[index];
          const date = parseInt(log.date);
          const logStatus = log.status == 0 ? 'success' : log.status > 0 ? 'error' : 'progress'
          html += `<div 
                    class="sublist-item btn flex item-${logStatus} ${index === 0 ? ' mb-8' : ''}"
                    onclick="showLog('env', '${env.name}', ${date}, ${log.status}${env.bot  !== undefined ? ', ' + env.bot : ''})">
                    <div class="icon icon-${logStatus}">${log.status == 0 ? '✔' : log.status > 0 ? '✖' : '⌛'}</div>
                    <span class="date">${date}</span></div>`
        }
        html += `<div class="btn secondary text-bold pa-0 ma-2" onclick="listLogs('env', '${env.name}'${env.bot  !== undefined && env.bot !== null ? ', ' + env.bot : ''})">
                  ⬇ <span class="ml-2">PREVIOUS LOGS</span>
                </div>`
      }
      html += `</div>
              <div
                class="btn primary mt-4 mb-2${status === -1 ? ' btn-disabled' : ''}"
                onclick="updateEnv(this, '${env.name}'${env.bot  !== undefined ? ', ' + env.bot : ''})">
                UPDATE
              </div>
            </div>`
    }
    html += '</div>'
    return { html, isRunning }
}

const dialog = () => {
  html = `<div id="dialog" class="cover" onclick="closeDialog(event)">
            <div class="modal">
              <div class="modal-bar">
                <div id="dialog-title" class="modal-title">Title</div>
                <div class="modal-close btn inline" onclick="closeDialog(event)">✖</div>
              </div>
              <div id="dialog-content" class="modal-content">Content</div>
            </div>
          </div>`
  return html
}

module.exports = {
  draw: async () => {
    const actions = await actionManager.getActions()
    const actionsByGroup = actions.groupBy('group').undefinedFirst()
    let isRunning = false
    let html = `<div class="flex flex-column">
                  <h4 class="text-header">ENVIRONMENTS</h4>`
    const envsHtml = await environmentsHtml()
    html += envsHtml.html + '</div>'
    isRunning = envsHtml.isRunning
    const hasUndefinedGroup = Object.keys(actionsByGroup)[0] === 'undefined'
    html += `<h2 class="text-header mt-8${!hasUndefinedGroup ? ' mb-0' : ''}">ACTIONS</h2><div class="flex-column mx-2">`
    for (const group in actionsByGroup) {
      const groupActions = actionsByGroup[group];
      if (group !== 'undefined') {
        html += `<h3 class="text-header">${group}</h3>`
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
          html += `<div class="flex mx-4 mb-4 pa-8 list-item">
                    <div class="flex flex-max justify-spaceAround align-center">
                      <div
                        class="btn primary ${status === -1 ? 'btn-disabled' : ''}"
                        onclick="triggerAction(this, '${action.key}'${action.bot  !== undefined ? ', ' + action.bot : ''})">${action.name.toUpperCase()}
                      </div>
                      <div class="action-updates text-center"><div class="action-status">${status === -1 ? 'Running' :
                        !!lastRun ? `Last run: <span class="link date ${status > 0 ? 'status-error' : status == 0 ? 'status-ok' : 'status-running'}" onclick="showLog('action', '${action.key}', ${lastRun}, ${status}${action.bot  !== undefined && action.bot !== null ? ', ' + action.bot : ''})">${lastRun}</span>` :
                        'Not run yet'}</div>
                        ${!!hasLogs ? `<span class="link" onclick="listLogs('action', '${action.key}'${action.bot  !== undefined && action.bot !== null  ? ', ' + action.bot : ''})">Previous runs</span>` : ''}
                      </div>`

          if (!!action.cron) {
            html +=`  <div class="action-schedule">
                        <a href="https://github.com/node-cron/node-cron#allowed-fields" target="_blank">Schedule</a>: ${action.cron}
                        <div
                          class="btn icon primary ${status === -1 ? 'btn-disabled' : ''}"
                          onclick="toggleAction(this, '${action.key}'${action.bot  !== undefined ? ', ' + action.bot : ''})">${action.isPaused ? '▶' : '&#10074;&#10074;'}</div>
                      </div>`
          }

          html += ` </div>
                  </div>`
        }
      html += '</div>'
    }
    html += '</div>' + dialog()
    if (isRunning) {
      html += '<script>setTimeout(location.reload, 1000 * 60 * 5)</script>'
    }
    return html
  }
}
