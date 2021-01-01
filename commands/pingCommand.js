const client = require('events');
const { Command } = require('discord-akairo');

class PingCommand extends Command {
  constructor() {
    super('ping', {
      aliases: ['ping']
    });
  }

  exec(message, args) {
    client.emit("guildMemberAdd", message.member);
    return message.reply('Pong!');
  }
}

module.exports = PingCommand;
