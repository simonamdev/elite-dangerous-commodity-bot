var tmi = require('tmi.js');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').execFile;
var DB = require('./db.js');

// Import options from other file
const options = require('./options.js');

// Reorganise options for tmiJS
const tmiOptions = {
    options: {
        debug: options.debug
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: options.twitch.username,
        password: options.twitch.oauthToken
    },
    channels: []
};

let db = new DB(options.database.path, options.debug);

db.initialise().then(() => {
    console.log('Starting EDCB Twitch interface');
    console.log(`Using oauth token: ${options.twitch.oauthToken.substring(0, 10)}...`);
    let client = new tmi.client(tmiOptions);
    client.connect().then((data) => {
        console.log(`Bot connected to Twitch`);
        db.getStreamerChannels().then((streamerNames) => {
            streamerNames.forEach((name) => {
                console.log(`Joining channel: ${name}`);
                client.join(name).then(() => {
                    console.log(`Joined channel: ${name}`);
                    client.say(name, 'E:D Commodity Bot has joined this channel');
                });
            });
        });
    });
    setupClientEvents(client);
});

let setupClientEvents = (client) => {
    // Receiving a request for information
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

    // TODO: See if this is needed
    // Disconnect from the channel if they host another one
    // client.on('hosting', (channel, target, viewers) => {
    //     client.part(channel);
    // });
};
