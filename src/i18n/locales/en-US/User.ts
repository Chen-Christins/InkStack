import helpCenter from "./user/HelpCenter";
import messages from "./user/Messages";
import security from "./user/Security";
import achievements from "./user/Achievements";

const user = {
    helpCenter,
    messages,
    security,
    achievements,
} as const;

export default user;
