
class Responses {
    public static channelInfoResponse(username: string): string {
        return `@${username} E:D Commodity Bot allows you to search for the closest
         star system that sells a specific commodity. Queries can be made by
         inviting ed_commodity_bot into your channel by typing !joinmychannel,
         then, in your channel,
         typing @ed_commodity_bot commodity name, system name.
         Make sure to include the comma, or E:D Commodity Bot will be unable
         to understand your request.
        `;
    }

    public static channelJoinResponse(username: string): string {
        return `@${username},
         I will be joining your channel in a short while.
         Requests should be in the form of:
         "@ed_commodity_bot commodity name, system name", including the comma.
         If you no longer require EDCB, type !leavemychannel in this chat
        `;
    }

    public static alreadyJoinedChannelResponse(username: string): string {
        return `@${username}, According to my records,
         I'm already setup to join your channel.
         If you do not need my services any longer,
         type !leavemychannel in this chat.
        `;
    }

    public static channelRemovalResponse(username: string): string {
        return `@${username}, I have left your channel.
         Thank you for using E:D Commodity Bot.
         If you want to use E:D Commodity Bot again,
         type !joinmychannel here again.
        `;
    }

    public static unableToRemoveResponse(username: string): string {
        return `@${username}, According to my records, I am not setup
         to join your channel. If you want E:D Commodity Bot
         in your channel, type !joinmychannel here.
        `;
    }

    public static cannotUnderstandRequestResponse(username: string): string {
        return `@${username}, I cannot understand your request.
         Make sure the format is, (including the comma):
         @ed_commodity_bot commodity name, system name.
         For example: @ed_commodity_bot coffee, sol
        `;
    }

    public static commodityDoesNotExistResponse(username: string, commodity: string): string {
        return `@${username}, The commodity: ${commodity} does not exist`;
    }

    public static noStationSellsCommodityResponse(username: string, commodity: string): string {
        return `@${username}, No stations sell the commodity: ${commodity}`;
    }

    public static stationsSellCommodityResponse(username: string, commodity: string, closestSystem: {}, referenceSystem: {}, distance: number, stations: {}[]): string {
        let response = `@${username}, my records contain a system
         close to ${referenceSystem['Name']} selling ${commodity}
         The ${closestSystem['Name']} system is ${Math.ceil(distance)}Ly away.
         It can be found at the following station/s:
        `;
        stations.forEach((station) => {
            response += ` [Name: ${station['Name']},
             Distance to star: ${station['DistanceToStar']}Ls,
             Largest landing pad: ${station['MaxLandingPad']}]
            `;
        });
        return response;
    }
};

export { Responses };
