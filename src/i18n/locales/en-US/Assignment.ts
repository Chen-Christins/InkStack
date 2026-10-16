import list from "./assignment/List";
import submit from "./assignment/Submit";
import submissions from "./assignment/Submissions";
import skeleton from "./assignment/Skeleton";

const assignment = {
    list,
    submit,
    submissions,
    skeleton,
} as const;

export default assignment;
