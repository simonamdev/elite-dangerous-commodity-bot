import { options, tmiOptions } from './options';
import { consoleLog } from './logging';
import { DB } from './db';
import * as tmi from 'tmi.js';
import { TwitchActions } from './twitch';

let twitchActions;
const twitchClient = new tmi.client(tmiOptions);
const db = new DB(options.database.path, options.debug);

db.initialise()
.then(() => {
    console.log('Initialising EDCB Twitch Interface');
    consoleLog(`Using oauth token: ${options.twitch.oauthToken.substring(0, 10)}...`);
})
.then(() => {
    twitchClient.connect().then((data) => {
        consoleLog('Connected to Twitch');
        twitchActions = new TwitchActions(twitchClient, db);
        twitchActions.setupClientEvents();
        twitchActions.joinStreamerChannels();
        twitchActions.sayInOwnChannel('E:D Commodity Bot is online');
    });
});
