var tmi = require('tmi.js');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').execFile;
var DB = require('./db.js');

let debug = true;
const edcbDataPath = './data/edcb.db';

let db = new DB(edcbDataPath, debug);
db.initialise();
db.getStreamerChannels();

// Load in oauth token from file
let oauthFileName = 'secrets/twitch-oauth';
let oauthToken = fs.readFileSync(oauthFileName, 'utf8');

const pathToOptimiser = path.resolve('elite-dangerous-commodity-bot.exe');

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
        password: oauthToken
    },
    channels: ['ed_commodity_bot']
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
            let data = JSON.parse(stdout);
            const referenceSystem = data['reference_system'];
            const closestSystem = data['closest_system'];
            const distance = Math.sqrt(
                Math.pow(referenceSystem['X'] - closestSystem['X'], 2) +
                Math.pow(referenceSystem['Y'] - closestSystem['Y'], 2) +
                Math.pow(referenceSystem['Z'] - closestSystem['Z'], 2)
            );
            let response = `
            @${userstate.username}, I found a system close to ${referenceSystem['Name']}
            selling ${data['commodity']['name']}.
            The ${closestSystem['Name']} system is ${Math.ceil(distance)}Ly away.
            Try the following station/s: `;
            for (let i = 0; i < data['stations'].length; i++) {
                let station = data['stations'][i];
                response += `[Name: ${station['Name']}, Distance: ${station['DistanceToStar']}Ls, Max Pad: ${station['MaxLandingPad']}]`;
            }
            client.say(channel, response);
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
