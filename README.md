# lets-git-pull

git-pull deployment management for [Lets][lets].
Basically provides the same functionality as capistrano.

## Current state


## Getting started

See [Lets][lets] for how to install lets.

Install lets-git-pull:

```bash
npm install lets-git-pull
```

Create the following **Letsfile.js**:

```js
var gitpull = require('lets-git-pull');

module.exports = function (lets) {
  // Create a stage
  var stagename = lets.Stage({
    host: '1.2.3.4',
    username: 'username',
    password: 'asdasd',
    agent: process.env.SSH_AUTH_SOCK,
    agentForward: true,

    repository: 'git@github.com:letsjs/lets-git-pull.git',
    remotePath: '/var/lets/sitename'
  });

  // Add your own instructions, like symlink to the server's folder
  stagename.on('deploy:publish', function (options, done) {
    this.getConnection(function(c) {
      c.exec('ln -nfs ' + options.current + ' /var/www/site.com', done);
    });
  });

  // Deploy using git pull
  stagename.plugin(gitpull());

  // Add the stage to lets
  lets.addStage('stagename', stagename);
};
```

Then run this in the terminal:

```bash
lets deploy:setup stagename
lets deploy:check stagename
lets deploy stagename
```

That's it! More examples will come later.

## Usage

### lets-ssh options:

The following options may be used but not specific to this plugin, see
[lets-ssh][lets-ssh] for more information:

* host (required)
* username (required)
* password
* agent
* agentForward
* tryKeyboard

### Required options:

**options.repository**  
The url of the repository.

**options.remotePath**  
The path where the files will be put on the remote, *without trailing slash*.

### Optional options:

**options.branch = 'master'**  
The branch to checkout. Default is master.

**options.keepRevisions = 5**  
How many revisions to keep on cleanup. Default is 5.

**options.copy = false**  
**Not implemented yet.** Set to true to clone the project locally and scp up the
code to the remote.


### Options made available by lets-git-pull:

**options.currentPath**  
The absolute path to the folder where the current revision is stored. Available
after `deploy:update`.

**options.current**  
The absolute path to the symlink ([remotePath]/current) to the current revision.
Use for e.g. symlinking the project to the webserver's public-html file.
Available after `deploy:publish`.


## TODO

* options.copy to scp when git clone is not possible on the remote


## Contribution

See guidelines for [lets][lets].


[lets]: https://github.com/letsjs/lets
[lets-ssh]: https://github.com/letsjs/lets-ssh
