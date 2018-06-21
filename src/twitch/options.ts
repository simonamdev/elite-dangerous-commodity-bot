import * as path from 'path';
import * as fs from 'fs';

const oauthFileName: string = 'secrets/twitch-oauth';
const optimiserFileName: string = 'elite-dangerous-commodity-bot.exe';

const options: any = {
    debug: process.env.NODE_ENV === 'development',
    database: {
        path: './src/twitch/edcb.db'
    },
    optimiser: {
        path: path.resolve(optimiserFileName)
    },
    twitch: {
        username: 'ed_commodity_bot',
        oauthToken: fs.readFileSync(oauthFileName, 'utf8')
    }
};

const tmiOptions: any = {
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

export { options, tmiOptions };
