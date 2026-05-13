"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadJson = exports.saveJson = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const saveJson = async (filePath, data) => {
    await (0, promises_1.mkdir)((0, node_path_1.dirname)(filePath), { recursive: true });
    await (0, promises_1.writeFile)(filePath, JSON.stringify(data, null, 2), "utf8");
};
exports.saveJson = saveJson;
const loadJson = async (filePath, defaultValue) => {
    try {
        const content = await (0, promises_1.readFile)(filePath, "utf8");
        return JSON.parse(content);
    }
    catch (error) {
        if (error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "ENOENT") {
            return defaultValue;
        }
        console.warn(`Failed to load JSON storage from ${filePath}:`, error);
        return defaultValue;
    }
};
exports.loadJson = loadJson;
