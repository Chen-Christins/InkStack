import stats from "./personal/Stats";
import center from "./personal/Center";
import articles from "./personal/Articles";
import tags from "./personal/Tags";
import assignments from "./personal/Assignments";
import organizations from "./personal/Organizations";
import notifications from "./personal/Notifications";
import editProfile from "./personal/EditProfile";
import following from "./personal/Following";
import follower from "./personal/Follower";
import apiConfig from "./personal/ApiConfig";

const personal = {
    stats,
    center,
    articles,
    tags,
    assignments,
    organizations,
    notifications,
    editProfile,
    following,
    follower,
    apiConfig,
} as const;

export default personal;
