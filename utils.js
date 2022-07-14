const http = require('http');

Object.defineProperty(Array.prototype, 'groupBy', {
  value: function (prop) {
    return this.reduce((group, elem) => {
      group[elem[prop]] = group[elem[prop]] ? group[elem[prop]] : [];
      group[elem[prop]].push(elem);
      return group;
    }, {})
  }
});

Object.defineProperty(Object.prototype, 'undefinedFirst', {
  value: function () {
    let keys = Object.keys(this)
    const undefIndex = keys.indexOf('undefined')
    if (undefIndex > -1) {
      keys.splice(undefIndex, 1)
      keys.unshift('undefined')
    }
    return keys.reduce((accumulator, key) => {
      accumulator[key] = this[key];
      return accumulator;
    }, {});
  }
});

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