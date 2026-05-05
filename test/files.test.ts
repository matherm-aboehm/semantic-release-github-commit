import { resolveFiles, readFileAsBlob, readFilesAsBlobs } from "../src/files";
import { SemanticReleaseError } from "../src/errors";
import path from "path";

import { globby } from "globby";
import { readFile } from "fs/promises";

// Mock dependencies
jest.mock("fs/promises");

const mockGlobby = globby as jest.MockedFunction<
  typeof globby
>;

const mockReadFile = readFile as jest.MockedFunction<
  typeof readFile
>;

describe("resolveFiles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use process.cwd() for cwd param", async () => {
    const cwd = "/test/repo";
    const patterns = ["dist/**", "CHANGELOG.md"];

    const mockCwd = jest.spyOn(process, 'cwd');
    mockCwd.mockReturnValue(cwd);

    await resolveFiles(patterns);

    expect(mockCwd).toHaveBeenCalled();
    expect(mockGlobby).toHaveBeenCalledWith(
      expect.arrayContaining(patterns),
      expect.objectContaining({
        cwd: cwd,
      })
    );
  });

  it("should use expected params for globby", async () => {
    const cwd = "/test/repo";
    const patterns = ["dist/**", "CHANGELOG.md"];
    const expectedResult = ["dist/index.js", "CHANGELOG.md"];

    mockGlobby.mockResolvedValue(expectedResult);

    const result = await resolveFiles(patterns, cwd);

    expect(mockGlobby).toHaveBeenCalledWith(
      expect.arrayContaining(patterns),
      expect.objectContaining({
        cwd: cwd,
        gitignore: false,
        dot: true,
        onlyFiles: true,
      })
    );
    expect(result).toStrictEqual(expectedResult);
  });

  it("should throw special error when globby throws", async () => {
    const cwd = "/test/repo";
    const patterns = ["abc(def)"];

    mockGlobby.mockRejectedValue(new Error("Pattern error"));

    expect.assertions(1);
    await expect(() => resolveFiles(patterns, cwd)).rejects.toThrow(
      new SemanticReleaseError("Failed to resolve file patterns", 'ENOFILES', "Pattern error"));
  });
});

describe("readFile(s)AsBlobs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use process.cwd() for cwd param", async () => {
    const cwd = "/test/repo";
    const paths = ["dist/index.js", "CHANGELOG.md"];

    const mockCwd = jest.spyOn(process, 'cwd');
    mockCwd.mockReturnValue(cwd);

    await readFilesAsBlobs(paths);
    expect(mockCwd).toHaveBeenCalled();

    mockCwd.mockClear();

    await readFileAsBlob(paths[0]);
    expect(mockCwd).toHaveBeenCalled();

    expect(mockReadFile).toHaveBeenCalledTimes(3);
    expect(mockReadFile).toHaveBeenCalledWith(path.join(cwd, paths[0]), "utf-8");
    expect(mockReadFile).toHaveBeenCalledWith(path.join(cwd, paths[1]), "utf-8");
  });

  it("should return expected file blobs", async () => {
    const cwd = "/test/repo";
    const paths = ["dist/index.js", "CHANGELOG.md", "icon.png"];
    const jsContent = Buffer.from("JS content");
    const mdContent = Buffer.from("Markdown content");
    const pngContent = Buffer.from("PNG content");
    const pngContentB64 = pngContent.toString('base64');

    mockReadFile.mockResolvedValueOnce(jsContent);
    mockReadFile.mockResolvedValueOnce(mdContent);
    mockReadFile.mockResolvedValueOnce(pngContent);

    const result = await readFilesAsBlobs(paths, cwd);
    expect(mockReadFile).toHaveBeenCalledWith(path.join(cwd, paths[0]), "utf-8");
    expect(mockReadFile).toHaveBeenCalledWith(path.join(cwd, paths[1]), "utf-8");
    expect(mockReadFile).toHaveBeenCalledWith(path.join(cwd, paths[2]));

    expect(result).toEqual([
      expect.objectContaining({path: paths[0], content: jsContent, encoding: "utf-8"}),
      expect.objectContaining({path: paths[1], content: mdContent, encoding: "utf-8"}),
      expect.objectContaining({path: paths[2], content: pngContentB64, encoding: "base64"}),
    ]);
  });

  it("should throw special error when globby throws", async () => {
    const cwd = "/test/repo";
    const paths = ["not-existing-file"];

    mockReadFile.mockRejectedValue(new Error("File doesn't exist"));

    expect.assertions(1);
    await expect(() => readFilesAsBlobs(paths, cwd)).rejects.toThrow(
      new SemanticReleaseError(`Failed to read file: ${paths[0]}`, 'ENOFILES', "File doesn't exist"));
  });
});