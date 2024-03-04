import { getClient } from "bottender";
import { User } from "../types/users.types";
import config from "../utils/config";
import { saveUserLang } from "../utils/api";

const client = getClient("messenger");

export const checkSpecialText = async (user: User, text: string): Promise<boolean> => {
    const recipient = user.userId.toString();

    // check if user is asking to cancel subscription
    if (text === '/cancel') {
        console.log(`[checkSpecialText] ${user.fullName} (id: ${user.userId}) is asking to cancel subscription`);

        await client.sendButtonTemplate(recipient ,config.texts.cancelSubscriptionButton, [
            {
                type: 'postback',
                title: 'Yes',
                payload: 'cancel_subscription',
            },
            {
                type: 'postback',
                title: 'No',
                payload: 'keep_subscription',
            },
        ]);
        return true;
    };

    // check if user is asking to change language to spanish
    if (text === '/spanish') {
        console.log(`[checkSpecialText] ${user.fullName} (id: ${user.userId}) is asking to change to Spanish`);
    };

    // check if user is asking to change language to english
    if (text === '/english') {
        console.log(`[checkSpecialText] ${user.fullName} (id: ${user.userId}) is asking to change to English`);
    };

    // FIXME: this is temp
    if (text === '/daily_practice') {
        if (user.lang === "es-ES") {
            return true;
        };
    };

    return false;
}