import * as tmi from 'tmi.js';
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
            if (isRegistrationCommand(channel, message)) {
                this.handleRegistrationCommand(username).then((response) => {
                    this.dbLogger.logResponse(username, message, response);
                });
            } else if (isRemovalCommand(channel, message)) {
                this.handleRemovalCommand(username).then((response) => {
                    this.dbLogger.logResponse(username, message, response);
                });
            } else if (isQueryCommand(message)) {
                this.handleQueryCommand(username, message);
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
                        this.sayInChannel(username, response);
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

    private handleQueryCommand() {}

    private isQueryCommand(message: string): boolean {
        const commodityBotPresent = message.indexOf('@ed_commodity_bot');
        const commaPresent = message.indexOf(',') === -1;
        return commodityBotPresent && commaPresent;
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

    private joinChannel(channelName: string) {
        return this.client.joinChannel(channelName);
    }
}

export { TwitchActions };
