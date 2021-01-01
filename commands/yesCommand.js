const { Command } = require('discord-akairo');

class YesCommand extends Command {
  constructor() {
    super('yes', {
      aliases: ['yes']
    });
  }

  exec(message) {
    return message.reply('No!');
  }
}

module.exports = YesCommand;
