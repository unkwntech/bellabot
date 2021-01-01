const { Command } = require('discord-akairo');

class CalcCommand extends Command {
  constructor() {
    super('calculator', {
      aliases: ['calculator']
    });
  }

  exec(message) {
    return message.reply('https://sites.google.com/view/bremen-inc');
  }
}

module.exports = CalcCommand;
