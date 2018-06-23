import * as tmi from 'tmi.js';
import * as util from 'util';
import { execFile } from 'child_process';
import { consoleLog, DatabaseLogger } from './logging';
import { DB } from './db';
import { options, tmiOptions } from './options';
import { Responses } from './responses';

class TwitchActions {
    private client: tmi.client;
    private db: DB;

    constructor(client: tmi.client, db: DB) {
        this.client = client;
        this.db = db;
        this.dbLogger = new DatabaseLogger(this.db);
    }

    private sayInChannel(username: string, message: string): void {
        this.client.say(username, message);
    }

    public sayInOwnChannel(message: string): void {
        this.sayInChannel(options.twitch.username, message);
    }

    public joinStreamerChannels(): void {
        this.db.getStreamerChannels().then((streamerChannels) => {
            console.log(`Joining ${streamerChannels.length} channels`);
            streamerChannels.forEach((streamer) => {
                consoleLog(`Joining: ${streamer}`);
                client.join(streamer).then(() => {
                    consoleLog(`Joined: ${streamer}`);
                }).catch((err) => {
                    consoleLog(`Error joining channel of: ${streamer}: ${err}`);
                });
            });
        });
    }

    public setupClientEvents(): void {
        this.client.on('chat', (channel, userstate, message, self) => {
            // Do nothing if ed_commodity_bot sent the message
            if (self) {
                return;
            }
            const username = userstate.username;
            if (isInfoCommand(channel, message)) {
                this.handleInfoCommand(username).then((response) => {
                    this.dbLogger.logQuery(username, channel, message, response);
                });
            } else if (isRegistrationCommand(channel, message)) {
                this.handleRegistrationCommand(username).then((response) => {
                    this.dbLogger.logQuery(username, channel, message, response);
                });
            } else if (isRemovalCommand(channel, message)) {
                this.handleRemovalCommand(username).then((response) => {
                    this.dbLogger.logQuery(username, channel, message, response);
                });
            } else if (isQueryCommand(message)) {
                this.handleQueryCommand(channel, username, message).then((response) => {
                    this.dbLogger.logQuery(username, channel, message, response);
                });
            } else {
                // Generic "cannot understand" response
                this.handleUnknownCommand(channel, username, message).then((response) => {
                    this.dbLogger.logQuery(username, channel, message, response);
                });
            }
        };
    }

    private handleRegistrationCommand(username: string) {
        return new Promise((resolve, reject) => {
            consoleLog(`Processing registration for: ${username}`);
            let response: string = '';
            this.db.checkIfStreamerAlreadyRegistered(username).then((alreadyRegistered) => {
                if (alreadyRegistered) {
                    consoleLog(`Already registered to join channel: ${username}`);
                    response = Responses.alreadyJoinedChannelResponse(username);
                    this.sayInOwnChannel(response);
                    resolve(response);
                } else {
                    this.joinChannel(username).then(() => {
                        consoleLog(`Joined channel: ${username}`);
                        response = Responses.channelJoinResponse(username);
                        this.sayInOwnChannel(response);
                        resolve(response);
                    });
                }
            });
        });
    }

    private handleRemovalCommand(username: string) {
        return new Promise((resolve, reject) => {
            consoleLog(`Processing removal for: ${username}`);
            let response: string = '';
            this.db.checkIfStreamerAlreadyRegistered(username).then((alreadyRegistered) => {
                if (alreadyRegistered) {
                    consoleLog(`Removing: ${username}`);
                    response = Responses.channelRemovalResponse(username);
                    this.db.removeStreamerChannel(username).then((removed) => {
                        consoleLog(`Removed: ${username}`);
                    });
                } else {
                    consoleLog(`${username} is not registered, unable to remove`);
                    response = Responses.unableToRemoveResponse(username);
                }
                this.sayInOwnChannel(response);
                resolve(response);
            });
        });
    }

    private handleInfoCommand(username: string) {
        return new Promise((resolve, reject) => {
            let response = Respones.channelInfoResponse(username);
            this.sayInOwnChannel(response);
        });
    }

    private handleQueryCommand(channel: string, username: string, message: string) {
        return new Promise((resolve, reject) => {
            consoleLog(`Processing query for: ${username}`);
            // Split on the comma and space
            const splitMessage = message.split(', ');
            // Get the commodity name and system name on either side
            const firstPart = splitMessage[0].split('ed_commodity_bot ');
            const commodityName = firstPart[1];
            const systemName = splitMessage[1];
            // These are to be used as CLI params
            const cliArgs = this.getCliArgs(commodityName, systemName);
            execFile(options.optimiser.path, cliArgs, (error, stdout, stderr) => {
                // console.log(`Error: ${error}`);
                // console.log(`STDOUT: ${stdout}`);
                // console.log(`STDERR: ${stderr}`);
                resolve(JSON.parse(stdout));
            });
        }).then((result) => {
            let response = 'Unable to recognise request';
            const commodity = result.commodity;
            const stations = result.stations;
            const referenceSystem = result.reference_system;
            const closestSystem = result.closest_system;
            if (!commodity.exists) {
                resposne = Responses.commodityDoesNotExistResponse(username, commodity.name);
            } else if (!stations) {
                response = Responses.noStationSellsCommodityResponse(username, commodity.name);
            } else {
                const distanceToClosestSystem = Math.sqrt(
                    Math.pow(referenceSystem['X'] - closestSystem['X'], 2) +
                    Math.pow(referenceSystem['Y'] - closestSystem['Y'], 2) +
                    Math.pow(referenceSystem['Z'] - closestSystem['Z'], 2)
                );
                response = Responses.stationsSellCommodityResponse(
                    username.name,
                    commodty.name,
                    closestSystem,
                    referenceSystem,
                    distanceToClosestSystem,
                    stations
                );
            }
            return this.sayInChannel(channel, response).then(() => {
                resolve(response);
            });
        });
    }

    private handleUnknownCommand(channel: string, username: string, message: string) {
        let response = '';
        return new Promise((resolve, reject) => {
            consoleLog(`Unable to understand message: ${message} from: ${username} in channel: ${channel}`);
            response = Responses.cannotUnderstandRequestResponse(username);
            this.sayInChannel(channel, response).then(() => {
                resolve(response);
            });
        });
    }

    private isQueryCommand(message: string): boolean {
        const targetedAtBot: boolean = message.indexOf(options.twitch.username) !== -1;
        const hasComma: boolean = message.indexOf(',') !== -1;
        retrun targetedAtBot && hasComma;
    }

    private isInfoCommand(channel: string, message: string): boolean {
        return isWithinOwnChannel(channel) && message == '!info';
    }

    private isRegistrationCommand(channel: string, message: string): boolean {
        return isWithinOwnChannel(channel) && message === '!joinmychannel';
    }

    private isRemovalCommand(channel: string, message: string): boolean {
        return isWithinOwnChannel(channel) && message === '!leavemychannel';
    }

    private isWithinOwnChannel(channel: string): boolean {
        return channel === `#${options.twitch.username}`;
    }

    private joinChannel(channelName: string): Promise {
        return this.client.joinChannel(channelName);
    }

    private getCliArgs(commodityName: string, systemName: string): string[] {
        const commodityArg = `-commodity=${commodityName}`;
        const systemArg = `-system=${systemName}`;
        const args = [commodityArg, systemArg];
        return args;
    }

    private handleCommodityDoesNotExist(): void {}
}

export { TwitchActions };
