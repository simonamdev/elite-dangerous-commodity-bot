
class Responses {
    public static channelJoinResponse(username: string): string {
        return
        `@${username},
         I will be joining your channel in a short while.
         Requests should be in the form of:
         "@ed_commodity_bot commodity name, system name", including the comma.
         If you no longer require EDCB, type !leavemychannel in this chat
        `;
    }

    public static alreadyJoinedChannelResponse(username: string): string {
        return
        `@${username}, According to my records,
         I'm already setup to join your channel.
         If you do not need my services any longer,
         type !leavemychannel in this chat.
        `;
    }

    public static channelRemovalResponse(username: string): string {
        return
        `@${username}, I have left your channel.
         Thank you for using E:D Commodity Bot.
         If you want to use E:D Commodity Bot again,
         type !joinmychannel here again.
        `;
    }

    public static unableToRemoveResponse(username: string): string {
        return
        `@${username}, accord to my records, I am not setup
         to join your channel. If you want E:D Commodity Bot
         in your channel, type !joinmychannel here.
        `;
    }

    public static cannotUnderstandRequestResponse(username: string): string {
        return
        `@${username}, I cannot understand your request.
         Make sure the format is, (including the comma):
         @ed_commodity_bot commodity name, system name.
         For example: @ed_commodity_bot coffee, sol
        `;
    }
};

export { Responses };
