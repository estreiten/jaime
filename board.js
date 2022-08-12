const envManager = require('./env.js');
const actionManager = require('./action.js');

const getStatusTxt = (status) => {
  if (isNaN(status)) {
    return 'progress'
  }
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
  let html = '<div class="flex flex-wrap flex-mobile">'
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
                  <div class="flex-max text-center">`;
      if (env.logs.length === 0) {
        html += 'Not updated yet'
      } else {
        for (let index = 0; index < env.logs.length && index < 3; index++) {
          const log = env.logs[index];
          const date = parseInt(log.date);
          const logStatus = log.status == 0 ? 'success' : log.status > 0 ? 'error' : 'progress'
          html += `<div 
                    class="sublist-item btn flex item-${logStatus} ${index === 0 ? ' mb-8' : ''}"
                    onclick="showLog('env', '${env.name}', '${env.name}', ${date}, ${log.status}${env.bot  !== undefined ? ', ' + env.bot : ''})">
                    <div class="icon icon-${logStatus}">${log.status == 0 ? '✔' : log.status > 0 ? '✖' : '⌛'}</div>
                    <span class="date">${date}</span></div>`
        }
        if (env.logs.length > 3) {
          html += `<div class="btn secondary text-bold pa-0 ma-2" onclick="listLogs('env', '${env.name}', '${env.name}'${env.bot  !== undefined && env.bot !== null ? ', ' + env.bot : ''})">
                    ⬇ <span class="ml-2">PREVIOUS UPDATES</span>
                  </div>`
        }
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

const actionsBtns = (actions) => {
  let html = ''
  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    const hasLogs = !!action.logs && action.logs.length > 0
    const status = hasLogs ? action.logs[0].status : -2
    html += `<div class="btn primary flex mr-2 mb-2${status === -1 ? ' btn-disabled' : ''}"
              onclick="triggerAction(this, '${action.key}'${action.bot  !== undefined ? ', ' + action.bot : ''})">
              ${status === -1 ? '<div class="icon icon-progress">⌛</div>' : ''}
              ${action.name.toUpperCase()}
            </div>`
  }
  return html
}

const actionsGrid = (actions) => {
  let html = `<div class="grid">
                <div class="grid-header">
                  <div class="grid-col col-2 justify-center">NAME</div>
                  <div class="grid-col col-3 justify-center">LAST RUN</div>
                  <div class="grid-col col-2 justify-center">
                    SCHEDULE
                    <div class="btn secondary icon-sm ml-2"
                      onclick="openTab('https://github.com/node-cron/node-cron#allowed-fields')" >
                      ℹ</div>
                  </div>
                  <div class="grid-col justify-center">ACTIONS</div>
                </div>`
  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    const hasLogs = !!action.logs && action.logs.length > 0
    const status = hasLogs ? action.logs[0].status : -2
    const statusTxt = getStatusTxt(status)
    const lastRun = hasLogs ? parseInt(action.logs[0].date) : null
    html += `<div class="grid-row">
              <div class="grid-col col-2 justify-center">${action.name}</div>
              <div class="grid-col col-3 justify-center">
                ${!!lastRun ?
                  `<div class="icon icon-${statusTxt}">${status == 0 ? '✔' : status > 0 ? '✖' : status == -1 ? '⌛' : ''}</div>
                  <span class="date ml-2">${lastRun}</span>` : ''}
              </div>
              <div class="grid-col col-2 justify-center">
                ${!!action.cron ? `<div class="badge">⏱ ${action.isPaused ? 'PAUSED' : 'ON'}</div><span class="ml-2">${action.cron}</span>` : ''}
              </div>
              <div class="grid-col justify-center">
                <div class="flex flex-max justify-spaceEvenly align-center">
                  ${!!action.cron ?
                  `<div class="btn condensed secondary ${action.isPaused ? 'btn-pressed' : 'my-1'}" 
                    onclick="toggleAction(this, '${action.key}'${action.bot  !== undefined ? ', ' + action.bot : ''})">
                    &#10074;&#10074;<span class="ml-2">⏱</span>
                  </div>` : ''
                  }
                  <div class="btn condensed secondary my-1${!!hasLogs ? '' : ' btn-disabled'}" 
                    onclick="listLogs('action', '${action.key}', '${action.name}'${action.bot  !== undefined && action.bot !== null  ? ', ' + action.bot : ''})">
                    📋<span class="ml-2">LOGS</span>
                  </div>
                  <div class="btn condensed primary my-1${status == -1 ? ' btn-disabled' : ''}"
                    onclick="triggerAction(this, '${action.key}'${action.bot  !== undefined ? ', ' + action.bot : ''})">
                    ▶<span class="ml-2">RUN</span>
                  </div>
                </div>
              </div>
            </div>`
  }
  html += '</div>'
  return html
}

const actionsCatalog = (actions) => {
  let html = '<div class="catalog">'
  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    const hasLogs = !!action.logs && action.logs.length > 0
    const status = hasLogs ? action.logs[0].status : -2
    const statusTxt = getStatusTxt(status)
    const lastRun = hasLogs ? parseInt(action.logs[0].date) : null
    html += `<div class="catalog-row">
              <div class="catalog-header">NAME</div>
              <div class="catalog-col">${action.name}</div>
            </div>
            <div class="catalog-row">
              <div class="catalog-header">LAST RUN</div>
              <div class="catalog-col">
                ${!!lastRun ?
                  `<div class="icon icon-${statusTxt}">${status == 0 ? '✔' : status > 0 ? '✖' : status == -1 ? '⌛' : ''}</div>
                  <span class="date ml-2">${lastRun}</span>` : ''}
              </div>
            </div>
            <div class="catalog-row">
              <div class="catalog-header">
                SCHEDULE
                <div class="btn secondary icon-sm ml-2"
                  onclick="openTab('https://github.com/node-cron/node-cron#allowed-fields')" >
                  ℹ</div>
              </div>
              <div class="catalog-col">
                ${!!action.cron ? `<div class="badge">⏱ ${action.isPaused ? 'PAUSED' : 'ON'}</div><span class="ml-2">${action.cron}</span>` : ''}
              </div>
            </div>
            <div class="catalog-row">
              <div class="catalog-header">ACTIONS</div>
              <div class="catalog-col">
                <div class="flex flex-max justify-spaceEvenly align-center">
                  ${!!action.cron ?
                  `<div class="btn condensed secondary ${action.isPaused ? 'btn-pressed' : 'my-1'}" 
                    onclick="toggleAction(this, '${action.key}'${action.bot  !== undefined ? ', ' + action.bot : ''})">
                    &#10074;&#10074;<span class="ml-2">⏱</span>
                  </div>` : ''
                  }
                  <div class="btn condensed secondary my-1${!!hasLogs ? '' : ' btn-disabled'}" 
                    onclick="listLogs('action', '${action.key}', '${action.name}'${action.bot  !== undefined && action.bot !== null  ? ', ' + action.bot : ''})">
                    📋<span class="ml-2">LOGS</span>
                  </div>
                  <div class="btn condensed primary my-1${status == -1 ? ' btn-disabled' : ''}"
                    onclick="triggerAction(this, '${action.key}'${action.bot  !== undefined ? ', ' + action.bot : ''})">
                    ▶<span class="ml-2">RUN</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="catalog-separator"></div>`
  }
  html += '</div>'
  return html
}

const actionGroupHtml = (group, actions, renderFn, cls) => {
  let html = `<div class="flex flex-column container-embed mb-2 mr-2 ${cls || ''}">`
  if (group !== 'undefined') {
    html += `<h4 class="text-header ma-0">${group}</h4>`
  }
  html += `<div class="flex flex-wrap mt-4">${renderFn(actions)}</div>
          </div>`
  return html
}

const actionsHtml = async () => {
  const actions = await actionManager.getActions()
  const actionsByGroup = actions.groupBy('group').undefinedFirst()
  let html = `<div class="tabs">
                <div class="tab selected" onclick="actionTab('actionButtons')">SIMPLE</div>
                <div class="tab" onclick="actionTab('actionGrid')">DETAIL</div>
              </div>
              <div id="actionButtons" class= "flex flex-wrap">`
  let isRunning = false
  for (const group in actionsByGroup) {
    const groupActions = actionsByGroup[group];
    if ((groupActions.length > 0) && (groupActions[0].status == -1)) {
      isRunning = true
    }
    html += actionGroupHtml(group, groupActions, actionsBtns)
  }
  html += `</div>
          <div id="actionGrid" class= "flex flex-wrap hidden">`
  for (const group in actionsByGroup) {
    const groupActions = actionsByGroup[group];
    html += actionGroupHtml(group, groupActions, actionsGrid, 'grid-container')
    html += actionGroupHtml(group, groupActions, actionsCatalog, 'catalog-container')
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
    let isRunning = false
    let html = `<div class="flex flex-column">
                  <h4 class="text-header">ENVIRONMENTS</h4>`
    const envsHtml = await environmentsHtml()
    html += envsHtml.html + '</div>'
    isRunning = envsHtml.isRunning
    html += `<div class="flex flex-column">
              <h4 class="text-header mb-2">ACTIONS</h4>`
    const actsHtml = await actionsHtml()
    html += actsHtml.html + '</div>' + dialog()
    isRunning = isRunning || actsHtml.isRunning
    if (isRunning) {
      html += '<script>setTimeout(location.reload, 1000 * 60 * 5)</script>'
    }
    return html
  }
}
