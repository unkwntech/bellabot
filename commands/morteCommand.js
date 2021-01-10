const { Command } = require('discord-akairo');

class MorteCommand extends Command {
  constructor() {
    super('morte', {
      aliases: ['morte']
    });
  }

  exec(message) {



    return message.reply('https://sites.google.com/view/bremen-inc');
  }
}

module.exports = MorteCommand;
