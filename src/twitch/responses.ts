import { consoleLog } from './logging';

class Responses {
    public static channelJoinResponse(username: string) {
        consoleLog(`Joined the following channel: ${username}`);
        return
        `@${username},
         I will be joining your channel in a short while.
         Requests should be in the form of:
         "@ed_commodity_bot commodity name, system name", including the comma.
         If you no longer require EDCB, type !leavemychannel in this chat
        `;
    }

    public static alreadyJoinedChannelResponse(username: string) {
        return
        `@${username}, According to my records,
         I'm already setup to join your channel.
         If you do not need my services any longer,
         type !leavemychannel in this chat.
        `;
    }
};

export { Responses };
