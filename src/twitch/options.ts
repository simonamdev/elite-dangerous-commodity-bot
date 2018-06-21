import path from 'path';
import fs from 'fs';

const oauthFileName = 'secrets/twitch-oauth';
const optimiserFileName = 'elite-dangerous-commodity-bot.exe';

const options: any = {
    debug: process.env.NODE_ENV === 'development',
    database: {
        path: './data/edcb.db'
    },
    optimiser: {
        path: path.resolve(optimiserFileName)
    },
    twitch: {
        oauthToken: fs.readFileSync(oauthFileName, 'utf8'),
        username: 'ed_commodity_bot'
    }
};

export { options };
