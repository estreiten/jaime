const fs = require('fs');
const config = require('./config');
const mailService = require('./mail');

/*
 * - status: 'ok' or 'fail'
 * - subjects: object with 'ok' and 'fail' keys, one subject string for each key
 * - data: config of the env/action element that triggered the notifier
 * - logFile: path to the log file
 */
const notify = async (subjects, status, data, logFile) => {
  if (data.notify) {
    const destinations = !Array.isArray(data.notify) ? [data.notify] : data.notify
    for (let index = 0; index < destinations.length; index++) {
      const destination = destinations[index];
      if (!destination.on || 
          (destination.on === 'success' && status === 'ok') ||
          (destination.on === 'failure' && status === 'fail')) {
        const subject = status === 'ok' ? subjects.ok : subjects.fail
        const host = config.publicHost
        const port = config.port
        const title = config.brand && config.brand.title ? config.brand.title : 'Jaime Board'
        let html = ''
        if (destination.level === 'log') {
          const log = fs.readFileSync(logFile, 'utf8')
          html = `Output log:<br><pre>${log}</pre><br><br>You can see `
        } else {
          html = 'You can see the output log and '
        }
        html += `previous runs in the <a href="http://${host}${port ? ':' + port : ''}" target="_blank">
          ${title}</a>.`

        await mailService.send({
          from: `${title} <${config.smtp.auth.user}>`,
          to: destination.mail,
          subject,
          html
        }).then(() => {
          console.log(`"${data.name}" mail notification sent to ${destination.mail}`)
        }).catch(err => {
          console.error(`"${data.name}" mail notification to ${destination.mail} failed`, err)
        })
      }
    }
  }
}

module.exports = {
  /*
   * - status: 'ok' or 'fail'
   * - logFile: path to the log file
   */
  notifyEnv: (status, env, branch, logFile) => {
    if (env.notify) {
      notify({
        ok: `New "${branch || env.branch || env.branchStart}" updates deployed to "${env.name}" environment`,
        fail: `New "${branch || env.branch || env.branchStart}" updates failed to deploy at "${env.name}" environment`
      }, status, env, logFile)
    }
  },
  /*
   * - status: 'ok' or 'fail'
   * - logFile: path to the log file
   */
  notifyAction: async (status, action, logFile) => {
    if (action.notify) {
      notify({
        ok: `The "${action.name}" action run${!!config.name ? ' at "' + config.name + '"' : ''} was completed successfully`,
        fail: `The "${action.name}" action run${!!config.name ? ' at "' + config.name + '"' : ''} failed`
      }, status, action, logFile)
    }
  }
}