var path = require('path');
var fs = require('fs');

const oauthFileName = 'secrets/twitch-oauth';
const optimiserFileName = 'elite-dangerous-commodity-bot.exe';
const edcbDatabasePath = './data/edcb.db';

let options = {
    debug: true,
    database: {
        path: edcbDatabasePath
    },
    optimiser: {
        path: path.resolve(optimiserFileName)
    },
    twitch: {
        oauthToken: fs.readFileSync(oauthFileName, 'utf8'),
        username: 'ed_commodity_bot'
    }
};

module.exports = options;
