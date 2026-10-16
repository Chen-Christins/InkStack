const error = {
    notFound: {
        title: "Oops, the page got lost!",
        descriptionLine1: "The page you are looking for is not on Earth. It may have been taken by aliens.",
        descriptionLine2: "Don't worry, let's take you home!",
        backHome: "Back to Home",
    },
    maintenance: {
        title: "Under Maintenance",
        description: "The site is under maintenance and temporarily unavailable. Please come back later.",
    },
} as const;

export default error;
