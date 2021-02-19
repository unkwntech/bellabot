const { Inhibitor } = require('discord-akairo');
// const mysql = require('mysql');
const Config = require('../config');

// let link = mysql.createConnection({
//     host: Config.MySQL.hostname,
//     user: Config.MySQL.username,
//     password: Config.MySQL.password,
//     database: Config.MySQL.database
//   });
  
//   link.connect((e) => {
//     if(e) throw e;});
  

class BlacklistInhibitor extends Inhibitor {

    blacklist =[];

    constructor() {
        super('blacklist', {
            reason: 'blacklist'
        })
    }

    async exec(message) {
        var blacklist = false;
        await message.client.guilds.fetch(Config.Discord.ServerID).then((guild) => {
            guild.members.fetch(message.author.id).then((member) => {
                var userRoles = member.roles.cache.array();
                for(var i = 0; i < userRoles.length; i++)
                    if(userRoles[i].id === Config.Discord.BlacklistRoleID)
                        blacklist = true;
            });
          });
        return blacklist;
    }
}

module.exports = BlacklistInhibitor;