import notification from "./components/Notification";
import themeStylePanel from "./components/ThemeStylePanel";
import applyCreateOrg from "./components/ApplyCreateOrg";
import commentNode from "./components/CommentNode";
import message from "./components/Message";
import dailyQuote from "./components/DailyQuote";
import addButton from "./components/AddButton";
import statsPanel from "./components/StatsPanel";
import subscribeBox from "./components/SubscribeBox";
import layoutWidthToggle from "./components/LayoutWidthToggle";
import customSelect from "./components/CustomSelect";
import layoutModeToggle from "./components/LayoutModeToggle";
import confirm from "./components/Confirm";
import tagPanel from "./components/TagPanel";
import selector from "./components/Selector";
import searchBox from "./components/SearchBox";
import searchArticle from "./components/SearchArticle";
import categoryPanel from "./components/CategoryPanel";
import broadcastMarquee from "./components/BroadcastMarquee";
import backToTop from "./components/BackToTop";
import orgSelector from "./components/OrgSelector";
import mermaid from "./components/Mermaid";
import loading from "./components/Loading";

const components = {
    notification,
    themeStylePanel,
    applyCreateOrg,
    commentNode,
    message,
    dailyQuote,
    addButton,
    statsPanel,
    subscribeBox,
    layoutWidthToggle,
    customSelect,
    layoutModeToggle,
    confirm,
    tagPanel,
    selector,
    searchBox,
    searchArticle,
    categoryPanel,
    broadcastMarquee,
    backToTop,
    orgSelector,
    mermaid,
    loading,
} as const;

export default components;
