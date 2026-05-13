import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const saveJson = async (filePath: string, data: unknown): Promise<void> => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
};

export const loadJson = async <T>(
  filePath: string,
  defaultValue: T,
): Promise<T> => {
  try {
    const content = await readFile(filePath, "utf8");

    return JSON.parse(content) as T;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return defaultValue;
    }

    console.warn(`Failed to load JSON storage from ${filePath}:`, error);
    return defaultValue;
  }
};
