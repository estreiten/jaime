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

const updateEnv = async (env, status) => {
  if (status === -1) {
    setTimeout(() => {location.reload()}, 2000)
  } else {
    await request('/update','post',{env})
    location.reload()
  }
}

const showLog = async (env, log, status) => {
  const logTxt = await request(`/log?env=${env}&date=${log}`, 'get')
  document.querySelector('main').innerHTML = `
    <h2 class="${status > 0 ? 'status-error' : 'status-ok'} pa-4">${new Date(log).toLocaleDateString()} ${new Date(log).toLocaleTimeString()}</h2>
    <pre><code>${logTxt}</code></pre>`
}