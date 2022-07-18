Jaime is a free CI and automation tool to build and test your hosted software projects.

## Installation
1. Install dependencies with ``npm install``
2. Copy `config.example.js` to `config.js`
3. Replace by the corresponding values in `config.js`, removing the comment characters.<br>
  Your environments must be set in the `config.js` file following the convention in the next example:

    ```
    env: {
      qa: {
        branch: 'release-',
        branchStart: true,
        path: '/home/project-qa'
      }
    }
    ```
    where: 
      - ``qa`` is your environment's name
      - ``branch`` is the Github's branch that will be deployed
      - ``branchStart`` determines that you only compare the ``branch`` string with the beginning of the branch pushed
      - ``path`` is the folder of your environment in the machine

4. You have to create a folder for your environments' scripts and logs, following the next convention:

    - create the ``env`` folder inside this projects root.
    - create a folder for each environment's name configured in the step above.
    - create a folder ``logs`` inside each environment's folder.
    - if your environment has a build script, create the ``build.sh`` file inside the environment's folder.
    - if your environment has a post-build script, create the ``post.sh`` file inside the environment's folder.

    For example: the ``qa`` environment has both build and post-build scripts. So the next structure was created:
    ````
    /env/qa/
    ---- build.sh
    ---- post.sh
    ---- logs/
    ````

    Note: make sure that the script files have the corresponding permissions to be executed by Jaime.
5. Assure that the ``update.sh`` script in the Jaime root has execute permissions for the user that will start Jaime.
6. Run with `npm start` and wait for the Github push hooks.

--------------

## Environment update triggers
An environment update can be triggered manually from the board with the Update button or by a Github push hook.<br>
Jaime comes with a pre-built Github push hook listener to trigger new updates. You only need to specify this property in the `config.js` file:

  ```
  hook: {
    port: 4000
  }
  ```
where ``port`` is the one used by the [Github hook](https://docs.github.com/en/developers/webhooks-and-events/webhooks/about-webhooks).

You can disable automatic update of environments when a new Github push hook is triggered by setting the ``auto: false`` property in the env config.

## Script parameters
When triggered by a Github push hook, the scripts will receive two parameters:
 1. the name of the branch updated
 2. the path of the output log

When triggered manually, the scripts will receive one parameter:
 1. the path of the output log<br>
It won't receive the updated branch here, since the update won't imply any branch change.

## Custom actions

To specify custom actions in the app, you have to create a special folder at the root of the project called ``actions``.<br>
The actions are buttons in the Jaime Manager board, with the action name inside them, that will trigger a specific script file.<br>
From that new ``actions`` folder, you have to create a folder with the action ``key``. Inside that folder, as same as with the environments, a ``logs`` folder and the script to be run under the ``run.sh`` name.<br>
For example, in the `config.js` file:

    actions: [
      {
        name: 'Play music',
        key: 'play'
      }
    ]

  when clicking the "Play music" button in the Jaime Manager board, it will trigger the ``run.sh`` script located inside the ``actions/play`` folder. The output will be displayed in a new file inside the ``logs`` folder.<br>
  Note: make sure that the script files have the corresponding permissions to be executed by Jaime.<br>
  Optional: you can also specify the ``root`` option in the action config. The action script will run in the folder specified by that property.

### Action groups
You can group actions by the system where they are hosted.<br>
To do so, you only need to define the ``name`` property at the root of the config file. <br>
For example:

    module.exports = {
      name: 'My Computer',
      auth: ...
      ...
    }

### Scheduled actions
You can tell Jaime to run actions automatically following a specified schedule.<br>
Just set the ``cron`` property in the action config following the [node-cron convention](https://github.com/node-cron/node-cron#allowed-fields).<br>
For example: ``cron: '*/2 * * *'`` to run every two hours or ``cron: '50 * * * *'`` to run every hour at 50 minutes (1:50, 2:50, etc).<br><br>
You can pause/resume the scheduler for that specific action with the corresponding play/pause button of the board.<br>
A paused action will have a ``.pause`` file inside its folder to notify the scheduler.

### Recursive actions (Linux only)
Under specific cases, you may need to invoke the same script again once it's finished.<br>
For those special cases, Jaime recognizes an exit code of 10 as an instruction to "Run this action again".<br>
So, if you need the script to run again, just add the ``exit 10`` line in your ``run.sh`` script.
  
## Bots: run tasks in remote workstations
If you need to run tasks in a remote computer, install a [Jaime Bot](https://github.com/estreiten/jaime-bot) there.
Then create a new key in the `config.js` file following the next convention:

    bots: [
      {
        host: 'bot-url-or-ip',
        port: bot_port
        token: 'bot_long_token_string'
      }
    ]

The remote bot should be running on the specified host:port and have the same token on its config file.<br>
It will be enough for Jaime to include the bots' environments in its board, display the logs and trigger manual or push-hook updates for them.

## Branding
You have a couple of config properties to get rid of Jaime titles and use your own branding.<br>
In the `config.js` file:

    branding: [
      {
        tab: 'tab text',
        title: 'board title'
      }
    ]

## Internal architecture for the curious mind
- To avoid multiple instances of the same env/action being run, we create a ".lock" file inside the env/action folder. 
If present and a new env/action is triggered, it tries again after 10 minutes. If the file is still present, it keeps trying until the 30 minute breach is reached. Then it just stops trying to execute.


## Coming next
- Send email notifications after update/action.
- Support for HTTPS, both Jaime and bots.
- Add environments and actions from the Board.
- Generic envs: create a specific folder for scripts to run on every environment, adding the env name as parameter.
- Board visual improvements.
- Optional tokens + password generator on installation step.