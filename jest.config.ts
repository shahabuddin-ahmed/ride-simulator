import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    clearMocks: true,
    moduleFileExtensions: ["ts", "js", "json"],
    moduleNameMapper: {
        "^src/(.*)$": "<rootDir>/src/$1",
    },
};

export default config;
