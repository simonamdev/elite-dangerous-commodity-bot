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
            console.log(`> Joining ${streamerChannels.length} channels`);
            streamerChannels.forEach((streamer) => {
                consoleLog(`Joining: ${streamer}`);
                this.client.join(streamer).then(() => {
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
            if (this.isInfoCommand(channel, message)) {
                this.handleInfoCommand(username).then((response) => {
                    this.dbLogger.logQuery(username, channel, message, response);
                });
            } else if (this.isRegistrationCommand(channel, message)) {
                this.handleRegistrationCommand(username).then((response) => {
                    this.dbLogger.logQuery(username, channel, message, response);
                });
            } else if (this.isRemovalCommand(channel, message)) {
                this.handleRemovalCommand(username).then((response) => {
                    this.dbLogger.logQuery(username, channel, message, response);
                });
            } else if (this.isQueryCommand(message)) {
                this.handleQueryCommand(channel, username, message).then((response) => {
                    this.dbLogger.logQuery(username, channel, message, response);
                });
            } else if (this.isTargetedAtBot(message)) {
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
                    return this.db.registerStreamerChannel(username).then((completed) => {
                        if (completed) {
                            response = Responses.channelJoinResponse(username);
                            this.sayInOwnChannel(response);
                            return this.joinChannel(username).then(() => {
                                consoleLog(`Joined channel: ${username}`);
                                resolve(response);
                            });
                        }
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
                        if (removed) {
                            consoleLog(`Removed: ${username}`);
                            this.client.part(username);
                        }
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
            let response = Responses.channelInfoResponse(username);
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
            const referenceSystemExists = result.reference_system_exists;
            const referenceSystem = result.reference_system;
            const closestSystem = result.closest_system;
            if (!commodity.exists) {
                response = Responses.commodityDoesNotExistResponse(username, commodity.name);
            } else if (!referenceSystemExists) {
                response = Responses.systemDoesNotExistResponse(username);
            } else if (!stations) {
                response = Responses.noStationSellsCommodityResponse(username, commodity.name);
            } else {
                const distanceToClosestSystem = Math.sqrt(
                    Math.pow(referenceSystem['X'] - closestSystem['X'], 2) +
                    Math.pow(referenceSystem['Y'] - closestSystem['Y'], 2) +
                    Math.pow(referenceSystem['Z'] - closestSystem['Z'], 2)
                );
                response = Responses.stationsSellCommodityResponse(
                    username,
                    commodity.name,
                    closestSystem,
                    referenceSystem,
                    distanceToClosestSystem,
                    stations
                );
            }
            this.sayInChannel(channel, response);
            return response;
        });
    }

    private handleUnknownCommand(channel: string, username: string, message: string) {
        let response = '';
        return new Promise((resolve, reject) => {
            consoleLog(`Unable to understand message: ${message} from: ${username} in channel: ${channel}`);
            response = Responses.cannotUnderstandRequestResponse(username);
            this.sayInChannel(channel, response);
            resolve(response);
        });
    }

    private isTargetedAtBot(message: string) {
        return message.indexOf(options.twitch.username) !== -1;
    }

    private isQueryCommand(message: string): boolean {
        const targetedAtBot: boolean = this.isTargetedAtBot(message);
        const hasComma: boolean = message.indexOf(',') !== -1;
        return targetedAtBot && hasComma;
    }

    private isInfoCommand(channel: string, message: string): boolean {
        return this.isWithinOwnChannel(channel) && message == '!info';
    }

    private isRegistrationCommand(channel: string, message: string): boolean {
        return this.isWithinOwnChannel(channel) && message === '!joinmychannel';
    }

    private isRemovalCommand(channel: string, message: string): boolean {
        return this.isWithinOwnChannel(channel) && message === '!leavemychannel';
    }

    private isWithinOwnChannel(channel: string): boolean {
        const hasHash = channel.indexOf('#') !== -1;
        if (!hasHash) {
            return channel.toLowerCase() === options.twitch.username.toLowerCase();
        }
        return channel.toLowerCase() === `#${options.twitch.username.toLowerCase()}`;
    }

    private joinChannel(channelName: string): Promise {
        return this.client.join(channelName);
    }

    private getCliArgs(commodityName: string, systemName: string): string[] {
        const commodityArg = `-commodity=${commodityName}`;
        const systemArg = `-system=${systemName}`;
        const args = [commodityArg, systemArg];
        return args;
    }
}

export { TwitchActions };
