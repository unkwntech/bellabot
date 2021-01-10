const client = require('events');
const { Command } = require('discord-akairo');

class PingCommand extends Command {
  constructor() {
    super('ping', {
      aliases: ['ping']
    });
  }

  exec(message, args) {
    return message.reply('Pong!');
  }
}

module.exports = PingCommand;
