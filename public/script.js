const request = (url, method, data, file = false) => {
  let opts = {
    redirect: 'follow',
    headers: {
      token: localStorage['token']
    }
  }
  if (method) {
    opts.method = method
  }
  if (data) {
    if (file) {
      opts.body = data
    } else {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(data)
    }
  }
  return fetch(url, opts)
  .then(async response => {
    if (response.redirected) {
      window.location.href = response.url
    } else {
      const view = response.headers.get('view')
      if (view) {
        document.querySelector('main').innerHTML = await response.text()
        if (view === 'login') {
          toggleMenuActions(false)
          loginScript()
        } else {
          toggleMenuActions(true)
        }
        parseDates()
        loadOperations()
      } else {
        return response.text()
      }
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

const toggleMenuActions = (show) => {
  const menuActions = document.querySelectorAll('.top-menu .btn, .top-menu .v-separator');
  for (let index = 0; index < menuActions.length; index++) {
    const action = menuActions[index];
    if (show) {
      action.classList.remove('hidden')
    } else {
      action.classList.add('hidden')
    }
  }
}

const parseDates = () => {
  const dates = document.getElementsByClassName('date')
  for (let index = 0; index < dates.length; index++) {
    const date = dates[index];
    if (!date.classList.contains('parsed')) {
      date.innerHTML = new Date(parseInt(date.innerHTML)).toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      })
      date.classList.add('parsed')
    }
  }
}

const loadOperations = () => {
  const tabs = document.getElementsByClassName('tab')
  for (let index = 0; index < tabs.length; index++) {
    const tab = tabs[index];
    tab.addEventListener('click', () => {
      if (!tab.classList.contains('selected')) {
        const siblings = tab.closest('.tabs').querySelectorAll('.tab')
        for (let index = 0; index < siblings.length; index++) {
          const sibling = siblings[index];
          sibling.classList.remove('selected')
        }
        tab.classList.add('selected')
      }
    })
  }
}

const getStatusTxt = (status) => {
  if (isNaN(status)) {
    return 'progress'
  }
  const statInt = parseInt(status)
  switch (statInt) {
    case 0: return 'success'
    case 3: return 'warn'
    case -2: return 'new'
    case -1: return 'progress'
    default: return 'error'
  }
}

const loginScript = () => {
  if (document.forms['loginForm']) {
    document.getElementById('passError').style.display = 'none';
    document.forms['loginForm'].addEventListener('submit', (event) => {
      event.preventDefault();
      fetch(event.target.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(event.target)) // event.target is the form
      }).then((resp) => {
        return resp.text()
      }).then((token) => {
        if (token === 'Forbidden') {
          document.getElementById('passError').style.display = 'initial'
        } else {
          document.getElementById('passError').style.display = 'none'
          localStorage['token'] = token
          request('/router')
        }
      }).catch((error) => {
        console.error('Error:', error)
      });
    });
  }
}

const logout = () => {
  localStorage.removeItem('token')
  location.reload()
}

const updateEnv = async (btnEl, env, bot) => {
  const itemEl = btnEl.closest('.list-item')
  if (!btnEl.classList.contains('btn-disabled')) {
    itemEl.classList.remove('bg-success', 'bg-error', 'bg-new')
    itemEl.classList.add('bg-progress')
    btnEl.classList.add('btn-disabled')
    const versionEl = document.getElementById(`${env.toLowerCase()}Version`)
    let version = {}
    if (versionEl) {
      const properties = [...versionEl.querySelectorAll('input')]
      for (let index = 0; index < properties.length; index++) {
        const propEl = properties[index]
        const name = propEl.getAttribute('name')
        version[name] = propEl.value
      }
    }
    const params = bot !== undefined ? {env, bot, version} : {env, version}
    request('/update','post', params).finally(() => {
       location.reload()
    })
  }
}

const openVersionSelect = (selectEl) => {
  const inputEl = selectEl.parentElement.querySelector(`input[name="${selectEl.name}"]`)
  const selectedOption = selectEl.parentElement.querySelector(`option[value="${inputEl.value}"]`)
  if (! selectedOption) {
    const fakeOption = document.getElementById('fakeOption')
    fakeOption.innerHTML = inputEl.value
    fakeOption.classList.remove('hidden')
    fakeOption.selected = true
  } else {
    selectedOption.selected = true
  }
}

const selectVersion = (selectEl) => {
  const fakeOption = document.getElementById('fakeOption')
  if (selectEl !== fakeOption) {
    const version = selectEl.value
    selectEl.parentElement.querySelector(`input[name="${selectEl.name}"]`).value = version
  }
  fakeOption.innerHTML = ''
  fakeOption.classList.add('hidden')
}

const blurVersionSelect = () => {
  const fakeOption = document.getElementById('fakeOption')
  fakeOption.innerHTML = ''
  fakeOption.classList.add('hidden')
}

const showLog = async (type, key, name, log, status, bot) => {
  let path = `/log?${type}=${key}&date=${log}`
  if (bot !== undefined) {
    path += `&bot=${bot}`
  }
  const logTxt = await request(path, 'get')
  const statusTxt = getStatusTxt(status)
  document.querySelector('main').innerHTML = `
    <div class="subtitle header flex align-center header-${statusTxt}">
      <div class="icon icon-${statusTxt}">${status == 0 ? '✔' : status === 3 ? '⚠️' : status > 0 ? '✖' : '⌛'}</div>
      <span class="mx-1 date">${log}</span>${type === 'env' ? ' on' : ' by'} "${name.toUpperCase()}"</div>
    <pre><code>${logTxt}</code></pre>`
  parseDates()
}

const listLogs = async (type, key, name, bot) => {
  let path = `/logs?${type}=${key}`
  if (bot !== undefined) {
    path += `&bot=${bot}`
  }
  const resp = await request(path, 'get')
  const logs = JSON.parse(resp).sort().reverse()
  if (logs.length > 0) {
    let html = `
      <div class="flex flex-column">`
      for (let index = 0; index <logs.length; index++) {
        const log = logs[index]
        const logArray = log.split('-')
        const date = logArray[0]
        const logStatus = getStatusTxt(logArray[1])
        const statusInt = parseInt(logArray[1])
        html += `<div 
                  class="sublist-item btn flex justify-spaceAround mx-4 my-2 item-${logStatus} ${index === 0 ? ' mb-8' : ''}"
                  onclick="showLog('${type}', '${key}', '${name}', ${date}, ${logArray[1]}${bot  !== undefined ? ', ' + bot : ''})">
                  <div class="icon icon-${logStatus}">${statusInt === 0 ? '✔' : statusInt === 3 ? '⚠️' : statusInt > 0 ? '✖' : '⌛'}</div>
                  <span class="date">${date}</span></div>`
      }
    html += '</div>'
    document.getElementById('dialog-content').innerHTML = html
    document.getElementById('dialog-title').innerHTML = `"${name.toUpperCase()}" ${type === 'env' ? 'Updates' : 'Logs'}`
    const dialogEl = document.getElementById('dialog')
    dialogEl.style.display = 'flex'
    parseDates()
  }
}

const triggerAction = async (btnEl, actionKey, bot) => {
   if (!btnEl.classList.contains('btn-disabled')) {
    btnEl.classList.add('btn-disabled')
    btnEl.innerHTML = '<div class="icon icon-progress">⌛</div>' + btnEl.innerHTML
    let params = bot !== null ? {key: actionKey, bot} : {key: actionKey}
    const selectEl = Array.from(btnEl.parentNode.children).find(node => node.tagName === 'SELECT')
    if (selectEl && selectEl.value) {
      params.param = selectEl.value
    }
    request('/action','post', params).then(() => {
      setTimeout(() => { location.reload() }, 1000 * 60 * 1)
    })
  }
}

const toggleAction = async (el, actionKey, bot) => {
  const params = bot !== null ? {key: actionKey, bot} : {key: actionKey}
  request('/toggle','post', params).then(() => {
    const ancestorEl = el.closest('.grid-col') || el.closest('.catalog-row')
    const badge = ancestorEl.previousElementSibling.querySelector('.badge')
    if (el.classList.contains('btn-pressed')) {
      el.classList.remove('btn-pressed')
      badge.innerHTML = '⏱ ON'
    } else {
      el.classList.add('btn-pressed')
      badge.innerHTML = '⏱ PAUSED'
    }
  })
}

const closeDialog = (ev) => {
  ev.preventDefault();
  if (ev.target.id === 'dialog' || ev.target.classList.contains('modal-close')) {
    document.getElementById('dialog').style.display = 'none'
  }
}

const actionTab = (id) => {
  const others = id === 'actionGrid' ? ['actionButtons'] : ['actionGrid']
  for (let index = 0; index < others.length; index++) {
    const otherTabId = others[index];
    const otherTab = document.getElementById(otherTabId)
    if (!otherTab.classList.contains('hidden')) {
      otherTab.classList.add('hidden')
      break
    }
  }
  document.getElementById(id).classList.remove('hidden')
}

const openTab = (url) => {
  window.open(url, "_blank")
}

const sendSmoke = () => {
  const fileInput = document.querySelector('input[type="file"]')
  console.log(fileInput.files[0])
  request('/smoke', 'POST', fileInput.files[0], true).then(() => {
    document.getElementById('dialog-content').innerHTML = "The smoke test results file was accepted.<br>You'll receive a smoke test notification email if necessary."
    document.getElementById('dialog-title').innerHTML = 'File accepted'
    const dialogEl = document.getElementById('dialog')
    dialogEl.style.display = 'flex'
  }).catch(() => {
    document.getElementById('dialog-content').innerHTML = "Please contact the admin."
    document.getElementById('dialog-title').innerHTML = 'File not accepted'
    const dialogEl = document.getElementById('dialog')
    dialogEl.style.display = 'flex'
  })
}