import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';

class DB {
    private path: string;
    private debug: boolean;
    private db: sqlite3.Database;

    constructor(path: string, debug: boolean) {
        this.path = path;
        this.debug = debug;
        this.initialiseDatabaseFile();
    }

    private openConnection(): void {
        this.db = new sqlite3.Database(this.path);
    }

    private initialiseDatabaseFile(): void {
        if (!!fs.existsSync(this.path) || this.debug) {
            fs.open(this.path, 'w', 0o666, (err, fd) => {
                if (err) {
                    throw err;
                }
            });
        }
    }

    public initialise(): Promise {
        return new Promise((resolve, reject) => {
            this.openConnection();
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
                    `CREATE TABLE IF NOT EXISTS logs (
                        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                        user TEXT NOT NULL,
                        query TEXT NOT NULL,
                        answer TEXT NOT NULL,
                        timestamp INTEGER NOT NULL
                    );`
                );
            });
            this.db.close(() => {
                console.log('Database schema initialised');
                resolve();
            });
        });
    }
}

export { DB };
