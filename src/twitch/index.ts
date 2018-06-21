import { options } from './options';
import { consoleLog } from './logging';
import { DB } from './db';

const myMessage: string = 'Hello';

consoleLog(myMessage);
consoleLog(options.debug);

const db = new DB(options.database.path, options.debug);
db.initialise();
