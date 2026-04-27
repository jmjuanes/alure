export default {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: [
        "@testing-library/jest-dom"
    ],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
};
