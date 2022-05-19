const envManager = require('./env.js');

module.exports = {
  draw: () => {
    const environments = envManager.getEnvironments()
    let html = '<div class="flex-column">'
    for (let index = 0; index < environments.length; index++) {
      const env = environments[index];
      html += `<div class="flex"><div>${env.name}</div><div class="btn white-blue" onclick="request('/update','post',{env: '${env.name}'})">Update</div></div>`
    }
    html += '</div>'
    return html
  }
}