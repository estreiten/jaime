const http = require('http');

const num = (number) => {
  return number.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false
  })
}

module.exports = {
  num,
  formatDate: (date) => {
    return `${date.getFullYear()}-${num(date.getMonth()+1)}-${num(date.getDate())} ${num(date.getHours())}:${num(date.getMinutes())}:${num(date.getSeconds())}`
  },
  request: async (params) => {
    let options = {
      hostname: params.hostname,
      port: params.port || 443,
      path: params.path || '/',
      method: params.method || 'GET',
      headers: params.headers || {}
    }
    let data = {}

    if (params.data) {
      data = JSON.stringify(params.data)

      options.headers['Content-Type'] = 'application/json'
      options.headers['Content-Length'] = data.length
    }

    return new Promise((resolve, reject) => {
      let out = []
      const req = http.request(options, res => {
        console.log(`Request ${options.hostname}:${options.port}${options.path}: ${res.statusCode}`);
        if (params.data) {
          console.log(`  Body: ${data}`)
        }

        res.on('data', chunk => {
          out.push(chunk);
        });

        res.on('end', () => {
          resolve(out.join(''))
        })
      })

      req.on('error', error => {
        console.error(error)
        reject(error)
      })

      if (params.data) {
        req.write(data)
      }

      req.end()
    })
  }
}