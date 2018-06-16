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
                        ('Purrcat259', 0, 1);
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
        this.openDatabaseConnection();
        this.db.serialize(() => {
            this.db.each(`SELECT name FROM channels;`, (err, row) => {
                console.log(err);
                console.log(row);
            });
            this.db.close();
        });
    }
}

module.exports = DB;
