const { AkairoClient, CommandHandler, ListenerHandler  } = require('discord-akairo');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const https = require('https');
const mysql = require('mysql');
const Config = require('./config');

let link = mysql.createConnection({
  host: Config.MySQL.hostname,
  user: Config.MySQL.username,
  password: Config.MySQL.password,
  database: Config.MySQL.database
});
link.connect((e) => {
  if(e) throw e;});
class MyClient extends AkairoClient {
  constructor() {
    super({
      // Options for Akairo go here.
      ownerID: '760488599640211526',
    }, {
      // Options for discord.js goes here.
    });
    this.commandHandler = new CommandHandler(this, {
      directory: './commands/',
      prefix: '!' // or ['?', '!']
    });
    this.listenerHandler = new ListenerHandler(this, {
      directory: './listeners/'
    });
    this.commandHandler.loadAll();
  }
}

const requestListener = function(request, response)
{
  if(request.url == "/")
  {
    //respond with login prompt
    //console.log(request);
    response.writeHead(200);
  }

  if(request.url.startsWith("/callback"))
  {
    //process oauth callback
    let parameters = request.url.split("?")[1].split("&");
    console.log(parameters);
    let code = "";

    parameters.forEach(function(e, i){
      if(e.startsWith("code"))
      {
        code = e.split("=")[1];
        let uuid = parameters[1].split("=")[1];
        console.log("uuid" + uuid);
        let data = {grant_type: "authorization_code", "code":code}

        //console.log(new Buffer(Config.ESI.ClientID + ":" + Config.ESI.SecretKey).toString('base64'))

        let options = {
          hostname: 'login.eveonline.com',
          port: 443,
          path: '/oauth/token',
          method: "POST",
          headers: {
            'Content-Type' : "application/json",
            'Content-Length' : JSON.stringify(data).length,
            'Authorization' : "Basic " + new Buffer(Config.ESI.ClientID + ":" + Config.ESI.SecretKey).toString('base64')
          }
        };

        let request = https.request(options, (res) => {
          res.on('data', (d) => {
            let tokens = JSON.parse(d.toString());

              //console.log("Connected to Database");
              link.query("UPDATE users SET ESI_AUTH_TOKEN = '" + tokens.access_token + "' WHERE UUID = '" + uuid + "'", (e, r) => {
                if(e) throw e;
              });

              //console.log(tokens.access_token);
              options = {
                hostname: 'login.eveonline.com',
                port: 443,
                path: '/oauth/verify',
                method: "GET",
                headers: {
                  //'Content-Type' : "application/json",
                  'Authorization' : "Bearer " + tokens.access_token
                }
              };

              https.get(options,  (res) => {
                let body = "";
                res.on('data', (d) => {
                  body += d;
                });
                res.on('end', function(){
                  //("body: \n" + body);
                  body = JSON.parse(body);
                  link.query("UPDATE users SET ESI_CHAR_ID = '" + body.CharacterID + "' WHERE ESI_AUTH_TOKEN = '" + tokens.access_token + "'", (e,r) => {
                    if(e) throw e;
                  })

                  getCharinfo(body.CharacterID);
                });
                res.on('error', (e) => {
                  console.log("Failed to verify access token\n" + e);
                })
              });
            //console.log(tokens);
          })
          res.on('error', (e) => {
            console.log("ERROR!")
            console.log(e);
            response.writeHead(500);
          })
        });

        request.write(JSON.stringify(data));
        request.end();

      }
    });
  }

  if(request.url.startsWith("/auth")) {
    let ESIuuid = request.url.split("/")[2];

    //redirect to ccp
    response.writeHead(302, {'Location': 'https://login.eveonline.com/oauth/authorize?response_type=code&redirect_uri=http://localhost/callback&client_id=' + Config.ESI.ClientID + '&state=' + ESIuuid});
  }
  response.end("\\o/");


  //console.log(request);
}
function getCharinfo(charID) {
  let body = "";
  const options = {
    hostname: 'esi.evetech.net',
    port: 443,
    path: '/latest/characters/' + charID,
    method: "GET",
  };

  https.get(options,  (res) => {
    res.on('data', (d) => {
      body += d;
    });
    res.on('end', function(){
      body = JSON.parse(body);
      // need to check for changed corp within corp

      let SQL = "UPDATE users SET ESI_CHAR_NAME = '" + body.name + "' WHERE ESI_CHAR_ID = " + charID;
      link.query(SQL, (e,r) => {
        if(e && e.errno !== 1062) {
          throw(e);
        }
      });

      getAllianceInfo(body.alliance_id, charID);
      getCorpInfo(body.corporation_id, charID);

    });
    res.on('error', (e) => {
      console.log("Failed to verify access token\n" + e);
    })
  });
}

function addRoles(DiscordID, RoleID) {
  client.guilds.fetch(Config.Discord.ServerID).then((guild) => {
    guild.members.fetch(DiscordID).then((member) => {
      guild.roles.fetch(RoleID).then((role) => {
        member.roles.add(role);
      });
    });
  });
}

function removeRoles(DiscordID, RoleID) {
  client.guilds.fetch(Config.Discord.ServerID).then((guild) => {
    guild.members.fetch(DiscordID).then((member) => {
      guild.roles.fetch(RoleID).then((role) => {
        member.roles.remove(role);
      });
    });
  });
}

function updateCorpRoles(charID) {
  let corpRole = "0", discordID
  // add corporation roles
  let SQL = "SELECT corporations.roleID as RoleID, users.id as DiscordID FROM corporations, users WHERE users.ESI_CORP_ID = corporations.id AND users.ESI_CHAR_ID = " +  charID;
  link.query(SQL, (e,r ) => {
    if(e) {
      throw(e);
    }
    if (r.length < 1) {
      console.log('no role for corporation'); // TODO: this needs to turn into a discord channel send.
      return;
    }
    corpRole = r[0].RoleID;
    discordID = r[0].DiscordID;
    addRoles(discordID, corpRole);
    // remove all existing corporation roles from the user except the current one

  });

  SQL = "SELECT roleID FROM corporations WHERE roleID NOT IN ('" + corpRole + "')";
  link.query(SQL, (e,r ) => {
    if(e) {
      throw(e);
    }
    if (r.length < 1) {
      console.log('no role for corporation'); // TODO: this needs to turn into a discord channel send.
      return;
    }
    for (let i = 0; i < r.length; i++) {
      removeRoles(discordID, r[i].roleID);
    }


    // remove all existing corporation roles from the user except the current one

  });
}

function updateAllianceRoles(charID) {
  // remove all existing alliance roles from the user except the current one

  // add corporation roles
  let SQL = "SELECT users.id as DiscordID, alliances.roleID as RoleID FROM corporations, users, alliances WHERE corporations.allianceID = alliances.id AND users.ESI_CORP_ID = corporations.id AND users.ESI_CHAR_ID = " +  charID;
  link.query(SQL, (e,r ) => {
    if(e) {
      throw(e);
    }
    if (r.length < 1) {
      console.log('no role for alliance'); // TODO: this needs to turn into a discord channel send.
      return;
    }
    addRoles(r[0].DiscordID, r[0].RoleID);
  });
}

function getCorpInfo(corpID, charID) {
  let body = "";
  options = {
    hostname: 'esi.evetech.net',
    port: 443,
    path: '/latest/corporations/' + corpID,
    method: "GET",
  };

  https.get(options,  (res) => {
    res.on('data', (d) => {
      body += d;
    });
    res.on('end', function(){
      //("body: \n" + body);
      body = JSON.parse(body);
      // need to check for changed alliance within corp
      link.query("INSERT INTO corporations (id, name, allianceID, ticker) VALUES (" + corpID + ", '" + body.name + "', " + body.alliance_id + ", '" + body.ticker + "')", (e,r) => {
        if(e && e.errno !== 1062) {
          throw(e);
        }
      })
      link.query("UPDATE users SET ESI_CORP_ID = " + corpID + " WHERE ESI_CHAR_ID = '" + charID + "'", (e,r) => {
        if(e) {
          throw(e);
        }
      })
      updateCorpRoles(charID);
    });
    res.on('error', (e) => {
      console.log("Failed to verify access token\n" + e);
    })
  });
  return body;
}

function getAllianceInfo(allianceID, charID) {
  let body = "";
  options = {
    hostname: 'esi.evetech.net',
    port: 443,
    path: '/latest/alliances/' + allianceID,
    method: "GET",
  };

  https.get(options,  (res) => {
    res.on('data', (d) => {
      body += d;
    });
    res.on('end', function(){
      //("body: \n" + body);
      body = JSON.parse(body);
      link.query("INSERT INTO alliances (id, name, ticker) VALUES (" + allianceID + ", '" + body.name + "', '" + body.ticker + "')", (e,r) => {
        if(e && e.errno !== 1062) {
          throw(e);
        }
      })
      updateAllianceRoles(charID);
    });
    res.on('error', (e) => {
      console.log("Failed to verify access token\n" + e);
    })
  });
  return body;
}

const server = http.createServer(requestListener);
server.listen(Config.HTTP.Port);

//END HTTP SETUP

function RefreshToken(refreshToken) {
  let data = {
    "grant_type": "refresh_token",
    "refresh_token": refreshToken
  };

  //console.log("Refresh Data: ");
  //console.log(data);

  options = {
    hostname: 'login.eveonline.com',
    port: 443,
    path: '/oauth/token',
    method: "POST",
    headers: {
      'Content-Type' : "application/json",
      'Content-Length' : JSON.stringify(data).length,
      'Authorization' : "Basic " + new Buffer(Config.ESI.ClientID + ":" + Config.ESI.SecretKey).toString('base64')
    }
  };

  let request = https.request(options, (res) => {
    let body ="";
    res.on('data', (d) => {
      body += d;
    });
    res.on('end', () => {
      tokens = JSON.parse(body.toString());

      //console.log(tokens);

      let link = mysql.createConnection({
        host: Config.MySQL.hostname,
        user: Config.MySQL.username,
        password: Config.MySQL.password,
        database: Config.MySQL.database
      });

      link.query("UPDATE users SET ESI_AUTH_TOKEN = '" + tokens.access_token + "' WHERE ESI_REFRESH_TOKEN = '" + refreshToken + "'", (e, r) => {if(e) throw e;} )
    });
    res.on('error', (e) => {
      console.log("ERROR!")
      console.log(e);
      response.writeHead(500);
    });
  });

  request.write(JSON.stringify(data));
  request.end();
}

const client = new MyClient();
client.login(Config.Discord.ClientToken);
// Attach a listener function
client.on("guildMemberAdd", (member) => {
  createAuthLink(member);
});

function createAuthLink(member) {
  let myUUID = uuidv4();
  console.log(`New User "${member.user.username}" has joined "${member.guild.name}"` );
  client.users.cache.get(member.id).send(`Welcome to the server, http://localhost/auth/${myUUID}`);

  link.query("INSERT INTO users (id, UUID) VALUES ('" + member.id + "', '" + myUUID + "')", (e, r) => {
    if (e) throw e;
  });
  console.log(`http://localhost/auth/${myUUID}`);
  member.guild.channels.cache.find(c => c.name === "foobar").send(`"${member.user.username}" has joined this server`);
}
