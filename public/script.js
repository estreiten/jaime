const request = (url, method, data) => {
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
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(data)
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
    date.innerHTML = new Date(parseInt(date.innerHTML)).toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    })
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

const updateEnv = async (el , env, bot) => {
  const itemEl = el.closest('.list-item')
  const statusEl = itemEl.firstElementChild
  if (!statusEl.classList.contains('status-running')) {
    statusEl.classList.remove('status-ok', 'status-error')
    statusEl.classList.add('status-running')
    const statusTxt = statusEl.firstElementChild
    statusTxt.classList.remove('text-ok', 'text-error')
    statusTxt.classList.add('text-running')
    statusTxt.innerHTML = 'Running'
    el.classList.add('btn-disabled')
    el.innerHTML = 'Running'
    const params = bot !== undefined ? {env, bot} : {env}
    request('/update','post', params).then(() => {
      setTimeout(() => { location.reload() }, 1000 * 60 * 1)
    })
  }
}

const showLog = async (type, key, log, status, bot) => {
  let path = `/log?${type}=${key}&date=${log}`
  if (bot !== undefined) {
    path += `&bot=${bot}`
  }
  const logTxt = await request(path, 'get')
  document.querySelector('main').innerHTML = `
    <div class="link" onclick="listLogs('${type}', '${key}'${bot  !== undefined ? ', ' + bot : ''})">All ${type === 'env' ? 'Updates' : 'Runs'}</div>
    <h2 class="${status > 0 ? 'status-error' : 'status-ok'} pa-4">
      <span class="date">${log}</span> ${type === 'env' ? 'on' : 'by'} "${key.toUpperCase()}"</h2>
    <pre><code>${logTxt}</code></pre>`
  parseDates()
}

const listLogs = async (type, key, bot) => {
  let path = `/logs?${type}=${key}`
  if (bot !== undefined) {
    path += `&bot=${bot}`
  }
  const resp = await request(path, 'get')
  const logs = JSON.parse(resp).sort().reverse()
  let html = `
    <h2 class="status-running pa-4">"${key.toUpperCase()}" ${type === 'env' ? 'Updates' : 'Runs'}</h2>
    <div class="flex flex-column">`
    for (let index = 0; index <logs.length; index++) {
      const log = logs[index]
      const logArray = log.split('-')
      const date = logArray[0]
      let status = ''
      let statusCls = ''
      switch (logArray[1]) {
        case undefined: status = 'Running'; statusCls = 'status-running text-running'; break
        case '0': status = 'Success'; statusCls = 'status-ok text-ok'; break
        case '1': status = 'Fail'; statusCls = 'status-error text-error'; break
        case '10': status = 'Re-run'; statusCls = 'status-ok text-ok'; break
        default: status = 'Fail'; statusCls = 'status-error text-error'
      }
      
      html += `<div class="flex align-center pa-2">
        <div class="link date" onclick="showLog('${type}', '${key}', ${date}, ${logArray[1]}${bot  !== undefined ? ', ' + bot : ''})">${date}</div>
        <div class="label ${statusCls}">${status}</div>
      </div>`
    }
  html += '</div>'
  document.querySelector('main').innerHTML = html
  parseDates()
}

const triggerAction = async (el, actionKey, bot) => {
   const itemEl = el.closest('.list-item')
   const statusEl = itemEl.firstElementChild
   if (!statusEl.classList.contains('status-running')) {
    statusEl.classList.remove('status-ok', 'status-error')
    statusEl.classList.add('status-running')
    el.classList.add('btn-disabled')
    const lastEl = itemEl.getElementsByClassName('action-status')[0]
    lastEl.innerHTML = 'Running'
    const params = bot !== null ? {key: actionKey, bot} : {key: actionKey}
    request('/action','post', params).then(() => {
      setTimeout(() => { location.reload() }, 1000 * 60 * 1)
    })
  }
}

const toggleAction = async (el, actionKey, bot) => {
  const params = bot !== null ? {key: actionKey, bot} : {key: actionKey}
  request('/toggle','post', params).then(() => {
    el.innerHTML = el.innerHTML === '▶' ? '&#10074;&#10074;' : '▶'
  })
}