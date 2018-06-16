var tmi = require('tmi.js');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').execFile;

// Load in oauth token from file
let oauthFileName = 'secrets/twitch-oauth';
let oauthToken = fs.readFileSync(oauthFileName, 'utf8');

const pathToOptimiser = path.resolve('elite-dangerous-commodity-bot.exe');
console.log(pathToOptimiser);

let debug = false;

console.log('Starting EDCB Twitch interface');
console.log(`Using oauth token: ${oauthToken.substring(0, 10)}...`);

let options = {
    options: {
        debug: debug
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: 'ed_commodity_bot',
        // username: 'Purrcat259',
        password: oauthToken
    },
    channels: ['Purrcat259']
};

let client = new tmi.client(options);

client.connect().then((data) => {
    console.log(`Bot connected to Twitch`);
    // console.log(`Connecting to ${streamTeamUsers.length} channels`);
    // streamTeamUsers.forEach((streamTeamChannel) => {
    //     client.join(streamTeamChannel).then((data) => {
    //         console.log(data);
    //     }).catch((err) => {
    //         console.error(err);
    //     });
    // });
});

client.on('chat', (channel, userstate, message, self) => {
    console.log(`[${channel}] <${userstate['display-name']}>: ${message}`);
    if (message.indexOf('@ed_commodity_bot') !== -1) {
        let data = message.split(', ')
        let commodityName = data[0].split('ed_commodity_bot ')[1]
        let systemName = data[1];
        // Pass in the commodity and system as CLI params
        let args = [`-commodity=${commodityName}`, `-system=${systemName}`];
        console.log(`${pathToOptimiser} ${args}`);
        exec(pathToOptimiser, args, (error, stdout, stderr) => {
            // console.log(`Error: ${error}`);
            // console.log(`STDOUT: ${stdout}`);
            // console.log(`STDERR: ${stderr}`);
            client.say(channel, stdout);
        });
    }
});

client.on('action', (channel, userstate, message, self) => {
    console.log(`[${channel}] <${userstate['display-name']}>: ${message}`);
});

client.on('join', (channel, username, self) => {
    if (self) {
        console.log(`Stalker joined: ${channel}`);
    }
    console.log(`[${channel}] ${username} has joined`);
});

client.on('part', (channel, username, self) => {
    if (self) {
        return;
    }
    console.log(`[${channel}] ${username} has left`);
});

client.on('hosting', (channel, target, viewers) => {
    // Disconnect from the channel if they host another one
    client.part(channel);
});
