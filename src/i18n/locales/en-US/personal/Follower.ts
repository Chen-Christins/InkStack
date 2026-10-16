const section = {
    title: "My Followers",
    peopleCount: "{{value}} people",
    loading: "Loading...",
    empty: "No Followers",
    joinedAt: "@{{account}} · Joined {{date}}",
    followingCount: "{{value}} Following",
    followerCount: "{{value}} Followers",
    paginationInfo: "Showing {{start}} - {{end}} of {{total}}",
    firstPage: "First",
    prevPage: "Previous",
    nextPage: "Next",
    lastPage: "Last",
} as const;

export default section;
