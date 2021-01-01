const { Command } = require('discord-akairo');

class helpCommand extends Command {
  constructor() {
    super('help', {
      aliases: ['help']
    });
  }

  exec(message) {
    return message.reply('When I have some, I will list all my commands here.');
  }
}

module.exports = helpCommand;
