const { Listener } = require('discord-akairo');

class addRoleListener extends Listener {
  constructor() {
    super('addRole', {
      emitter: 'client',
      event: 'addRole'
    });
  }

  exec(message) {
    // !addRole @role
    return message.reply('A new user has joined');
    console.log('new user');
  }
}

module.exports = addRoleListener;
