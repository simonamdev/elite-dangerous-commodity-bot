var fs = require('fs');

let sqlite3 = require('sqlite3').verbose();


class DB {
    constructor(path, debug) {
        this.debug = debug;
        this.path = path
    }

    openDatabaseConnection() {
        this.db = new sqlite3.Database(this.path);
    }

    createFileIfNotExists() {
        if (this.debug) {
            fs.open(this.path, 'w', 0o666, (err, fd) => {
                if (err) {
                    throw err;
                }
            });
        }
    }

    initialise() {
        return new Promise((resolve, reject) => {
            this.createFileIfNotExists();
            console.log('Initialising database schema');
            this.openDatabaseConnection();
            this.db.serialize(() => {
                this.db.run(
                    `CREATE TABLE IF NOT EXISTS channels (
                        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL UNIQUE,
                        timeAdded INTEGER NOT NULL,
                        valid BOOLEAN NOT NULL CHECK (valid IN (0, 1))
                    );`
                );
                this.db.run(
                    `INSERT INTO channels
                        (name, timeAdded, valid)
                        VALUES
                        ('purrcat259', 0, 1);
                    `
                );
            });
            this.db.close(() => {
                console.log('Database schema initialised');
                resolve();
            });
        });
    }

    getStreamerChannels() {
        return new Promise((resolve, reject) => {
            let streamerNames = [];
            this.openDatabaseConnection();
            this.db.serialize(() => {
                this.db.all(`SELECT name FROM channels WHERE valid = 1;`, (err, rows) => {
                    streamerNames = rows.map((row) => {
                        return row.name;
                    });
                });
                this.db.close(() => {
                    resolve(streamerNames);
                });
            });
        });
    }

    checkIfStreamerAlreadyRegistered(channelName) {
        return new Promise((resolve, reject) => {
            this.getStreamerChannels().then((streamerNames) => {
                resolve(streamerNames.indexOf(channelName) !== -1);
            });
        });
    }

    registerStreamerChannel(channelName) {
        return new Promise((resolve, reject) => {
            this.openDatabaseConnection();
            this.db.serialize(() => {
                let statement = this.db.prepare(
                    `INSERT OR IGNORE INTO channels
                    (name, timeAdded, valid)
                    VALUES
                    (?, ?, 1);`
                );
                statement.run(channelName, Math.floor(Date.now() / 1000));
                statement.finalize();
                this.db.close(() => {
                    resolve(true);
                });
            });
        });
    }
}

module.exports = DB;
