const section = {
    loading: "Loading...",
    authRequired: "You need to sign in to access the R&D Platform.",
    checkingAccess: "Verifying permissions...",
    needOrgTitle: "Organization Membership Required",
    needOrgLine1: "The R&D Platform requires you to join an organization and hold a Reporter or higher role within it.",
    needOrgLine2:
        "Please go to the Organizations page to find and apply to join your team, or contact an organization administrator to grant you access.",
    joinOrg: "Join Organization",
    backHome: "Back to Home",
    switchAccount: "Switch Account",
    brand: "R&D Platform",
    openMenu: "Open menu",
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
    breadcrumbHome: "R&D Platform",
    breadcrumb: {
        create: "Create",
        edit: "Edit",
        detail: "Details",
    },
    sections: {
        overview: "Overview",
        rdManagement: "R&D Management",
        smartCollab: "Smart Collaboration",
        analytics: "Analytics",
        myRelated: "My Items",
    },
    nav: {
        dashboard: "Dashboard",
        requirements: "Requirements",
        bugs: "Bugs",
        tasks: "Tasks",
        reviews: "Code Review",
        agent: "Agent Assistant",
        trends: "Trends",
        myTickets: "My Tickets",
    },
    roles: {
        member: "Member",
        reporter: "Reporter",
        developer: "Developer",
        rdLead: "R&D Lead",
        orgAdmin: "Organization Admin",
    },
} as const;

export default section;
