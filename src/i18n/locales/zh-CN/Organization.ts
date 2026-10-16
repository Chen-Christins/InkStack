import list from "./organization/List";
import detail from "./organization/Detail";
import tabs from "./organization/Tabs";
import info from "./organization/Info";
import repos from "./organization/Repos";
import skeleton from "./organization/Skeleton";

const organization = {
    list,
    detail,
    tabs,
    info,
    repos,
    skeleton,
} as const;

export default organization;
