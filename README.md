### Installation
1. Install dependencies with ``npm install``
2. Copy `config.example.js` to `config.js`
3. Replace by the corresponding values in `config.js`.<br>
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

### Script parameters
When triggered by a Github push hook, the scripts will receive two parameters:
 1. the name of the branch updated
 2. the path of the output log
When triggered manually, the scripts will receive one parameter:
 1. the path of the output log
  It won't receive the updated branch here, since the update won't imply any branch change.

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
  Optional: you can also specify the ``root`` option in the action config. The action script will run in the folder specified by that property.
  
### Bots: run tasks in remote workstations
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

### Internal arch for the curious mind
- To avoid multiple instances of the same env/action being run, we create a ".lock" file inside the env/action folder. 
If present and a new env/action is triggered, it tries again after 10 minutes. If the file is still present, it keeps trying until the 30 minute breach is reached. Then it just stops trying to execute.


### Coming next
- Support for HTTPS, both Jaime and bots.
- Generic envs: create a specific folder for scripts to run on every environment, adding the env name as parameter.
- Board visual improvements.
- Optional tokens + password generator on installation step.