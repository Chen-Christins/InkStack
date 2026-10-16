const section = {
    title: "My Following",
    peopleCount: "{{value}} people",
    loading: "Loading...",
    empty: "Not Following Anyone",
    joinedAt: "@{{account}} · Joined {{date}}",
    followingCount: "{{value}} Following",
    followerCount: "{{value}} Followers",
    unfollow: "Unfollow",
    paginationInfo: "Showing {{start}} - {{end}} of {{total}}",
    firstPage: "First",
    prevPage: "Previous",
    nextPage: "Next",
    lastPage: "Last",
} as const;

export default section;
