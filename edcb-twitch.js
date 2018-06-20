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
    channels: [options.twitch.username]
};

let db = new DB(options.database.path, options.debug);

// TODO: Move to separate file
const joinMessage = `E:D Commodity Bot has joined this channel by
 request of the streamer. If this is no longer needed,
 please head to ed_commodity_bot's channel and say !leavemychannel
 in chat`;

db.initialise().then(() => {
    console.log('Starting EDCB Twitch interface');
    console.log(`Using oauth token: ${options.twitch.oauthToken.substring(0, 10)}...`);
    let client = new tmi.client(tmiOptions);
    client.connect().then((data) => {
        console.log(`Bot connected to Twitch`);
        db.getStreamerChannels().then((streamerNames) => {
            console.log(`Joining ${streamerNames.length} channels`);
            streamerNames.forEach((name) => {
                console.log(`Joining channel: ${name}`);
                client.join(name).then(() => {
                    console.log(`Joined channel: ${name}`);
                    client.say(name, joinMessage);
                });
            });
        });
    });
    setupClientEvents(client);
});

let setupClientEvents = (client) => {
    // Receiving a request for information
    client.on('chat', (channel, userstate, message, self) => {
        // Do nothing if EDCB sent the message
        if (self) {
            return;
        }
        // If they are posting in the ed    commodity bot channel, then handle it as a user registration
        if (channel === `#${options.twitch.username}` && message === '!joinmychannel') {
            const username = userstate.username;
            console.log(`Processing join command for: ${userstate['username']}`);
            db.checkIfStreamerAlreadyRegistered(username).then((alreadyRegistered) => {
                if (!alreadyRegistered) {
                    db.registerStreamerChannel(username).then((completed) => {
                        if (completed) {
                            console.log(`Added ${username} to the list of channels`);
                            // TODO Generalise this with the joining sequence at the top
                            client.join(username).then(() => {
                                console.log(`Joined channel: ${username}`);
                                client.say(
                                    options.twitch.username,
                                    `@${username}, I will be joining your channel in a short while. Make sure that the requests are in the form of: "@ed_commodity_bot commodity name, system name", including the comma. If you no longer require my services, please say !leavemychannel in this chat`
                                );
                                client.say(username, joinMessage);
                            });
                        }
                    }).catch((err) => {
                        console.log(`Error registering channel: ${username}, Error: ${err}`);
                    });
                } else {
                    console.log(`${username} is already registered`);
                    client.say(
                        options.twitch.username,
                        `@${username}, According to my records, I'm already setup to join your channel. `
                    );
                }
            });
        } else {
            // In any other channel, work as usual
            const username = userstate['display-name'];
            console.log(`[${channel}] <${username}>: ${message}`);
            // Only take notice of messages targeted at the commodity bot
            if (message.indexOf('@ed_commodity_bot') !== -1) {
                // If there is no comma, then state that the message cannot be understood
                if (message.indexOf(',') === -1) {
                    client.say(channel, `@${username}, I cannot understand your request. Make sure the format is, (including the comma): @ed_commodity_bot commodity name, system name.`);
                    return;
                }
                let data = message.split(', ')
                let commodityName = data[0].split('ed_commodity_bot ')[1]
                let systemName = data[1];
                // Pass in the commodity and system as CLI params
                let args = [`-commodity=${commodityName}`, `-system=${systemName}`];
                exec(options.optimiser.path, args, (error, stdout, stderr) => {
                    // console.log(`Error: ${error}`);
                    // console.log(`STDOUT: ${stdout}`);
                    // console.log(`STDERR: ${stderr}`);
                    let data = JSON.parse(stdout);
                    const commodity = data['commodity'];
                    const stations = data['stations'];
                    const referenceSystem = data['reference_system'];
                    const closestSystem = data['closest_system'];
                    let response = 'Unknown error occurred';
                    // Return a negative response if the commodty does not exist or no stations sell it
                    if (!commodity['exists']) {
                        response = `@${username}, The commodity: ${commodity['name']} does not exist.`;
                    } else if (!stations) {
                        response = `@${username}, No stations sell the commodity: ${commodity['name']}.`;
                    } else if (commodity['exists'] && stations && stations.length) {
                        const distance = Math.sqrt(
                            Math.pow(referenceSystem['X'] - closestSystem['X'], 2) +
                            Math.pow(referenceSystem['Y'] - closestSystem['Y'], 2) +
                            Math.pow(referenceSystem['Z'] - closestSystem['Z'], 2)
                        );
                        response = `
                        @${username}, I found a system close to ${referenceSystem['Name']}
                        selling ${commodity['name']}.
                        The ${closestSystem['Name']} system is ${Math.ceil(distance)}Ly away.
                        Try the following station/s: `;
                        for (let i = 0; i < data['stations'].length; i++) {
                            let station = data['stations'][i];
                            response += `[Name: ${station['Name']}, Distance: ${station['DistanceToStar']}Ls, Max Pad: ${station['MaxLandingPad']}]`;
                        }
                    }
                    client.say(channel, response);
                });
            }
        }
    });

    // TODO: See if this is needed
    // Disconnect from the channel if they host another one
    // client.on('hosting', (channel, target, viewers) => {
    //     client.part(channel);
    // });
};
