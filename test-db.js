let DB = require('./db.js');

let db = new DB('./data/edcb.db', true);
setTimeout(
    () => {
        db.getStreamerChannels();
    },
    3000
);
