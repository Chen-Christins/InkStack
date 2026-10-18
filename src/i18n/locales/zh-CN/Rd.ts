import layout from "./rd/Layout";
import dashboard from "./rd/Dashboard";
import requirements from "./rd/Requirements";
import bugs from "./rd/Bugs";
import tasks from "./rd/Tasks";
import myTickets from "./rd/MyTickets";
import reviews from "./rd/Reviews";
import ticketDetail from "./rd/TicketDetail";
import agent from "./rd/Agent";
import agentConfig from "./rd/AgentConfig";
import trend from "./rd/Trend";
import orgGate from "./rd/OrgGate";
import entryLoader from "./rd/EntryLoader";

const rd = {
    layout,
    dashboard,
    requirements,
    bugs,
    tasks,
    myTickets,
    reviews,
    ticketDetail,
    agent,
    agentConfig,
    trend,
    orgGate,
    entryLoader,
} as const;

export default rd;
