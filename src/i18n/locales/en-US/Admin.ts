import layout from "./admin/Layout";
import dashboard from "./admin/Dashboard";
import users from "./admin/Users";
import articles from "./admin/Articles";
import assignments from "./admin/Assignments";
import organizations from "./admin/Organizations";
import comments from "./admin/Comments";
import categories from "./admin/Categories";
import media from "./admin/Media";
import mediaMock from "./admin/MediaMock";
import data from "./admin/Data";
import settings from "./admin/Settings";
import notifications from "./admin/Notifications";
import feedbacks from "./admin/Feedbacks";

const admin = {
    layout,
    dashboard,
    users,
    articles,
    assignments,
    organizations,
    comments,
    categories,
    media,
    mediaMock,
    data,
    settings,
    notifications,
    feedbacks,
} as const;

export default admin;
