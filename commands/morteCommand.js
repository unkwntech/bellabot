const { Command } = require('discord-akairo');
const Config = require("../config")
const mysql = require('mysql');

class MorteCommand extends Command {
  constructor() {
    super('morte', {
      aliases: ['morte']
    });
  }

  async exec(message) {
    let link = mysql.createConnection({
      host: Config.MySQL.hostname,
      user: Config.MySQL.username,
      password: Config.MySQL.password,
      database: Config.MySQL.database
    });
    
    link.connect((e) => {
      if(e) throw e;});

    link.query(`SELECT users.ESI_CORP_ID as corpID, corporations.allianceID FROM users, corporations WHERE users.id = ${message.author.id} AND corporations.id = users.ESI_CORP_ID LIMIT 1`, async function(e, r){
      if([].includes(r[0].corpID) || [498125261].includes(r[0].allianceID))
      {
        message.client.guilds.fetch(Config.Discord.ServerID).then(async (guild) => {
          guild.members.fetch(message.author.id).then(async (member) => {
            guild.roles.fetch(Config.Discord.MorteRole).then(async (role) => {
              try{
                await member.roles.add(role);
                console.log(`Granted Morte to ${message.author.id}`)
              }
              catch(e)
              {
                console.error(e);
              }
            });
          });
        });
      }
      else
      {
        message.reply("Your corp or alliance is not whitelisted for that role.");
      }

    });


    
  }
}

module.exports = MorteCommand;
