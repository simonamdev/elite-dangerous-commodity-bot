let DB = require('./db.js');

let db = new DB('./data/edcb.db', true);
db.initialise().then(() => {
    db.getStreamerChannels();
});
