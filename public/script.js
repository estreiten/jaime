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
          loginScript()
        }
      } else {
        return response.text()
      }
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
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

const showLog = async (env, log, status, bot) => {
  let path = `/log?env=${env}&date=${log}`
  if (bot !== undefined) {
    path += `&bot=${bot}`
  }
  const logTxt = await request(path, 'get')
  document.querySelector('main').innerHTML = `
    <h2 class="${status > 0 ? 'status-error' : 'status-ok'} pa-4">${new Date(log).toLocaleDateString()} ${new Date(log).toLocaleTimeString()} on ${env.toUpperCase()}</h2>
    <pre><code>${logTxt}</code></pre>`
}

const triggerAction = async (action, bot) => {
  const params = bot !== null ? {name: action, bot} : {name: action}
  await request('/action','post', params)
}
