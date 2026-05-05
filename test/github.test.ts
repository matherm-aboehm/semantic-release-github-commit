import { GitHubClient } from "../src/github";
import { SemanticReleaseError } from "../src/errors";

import { Octokit } from "@octokit/rest";
import path from "path";
import { url } from "inspector";

const mockOctokit = Octokit as jest.MockedClass<
  typeof Octokit
>;

describe("GitHubClient.constructor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should pass auth token", () => {
    new GitHubClient("test-token");

    expect(mockOctokit).toHaveBeenCalledWith(
      expect.objectContaining({ auth: "test-token" }));
    expect(mockOctokit).toHaveReturnedWith(
      expect.objectContaining({ rest: expect.anything() }));
  });
});

describe("GitHubClient", () => {
  var clientToTest: GitHubClient;
  var mockedOctokit: Octokit;
  beforeAll(() => {
    jest.clearAllMocks();

    clientToTest = new GitHubClient("test-token");
    mockedOctokit = mockOctokit.mock.results[0].value;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // getRef
  it("getRef should succeed", async () => {
    const mockedGetRef = mockedOctokit.rest.git.getRef as jest.MockedFunction<
      typeof mockedOctokit.rest.git.getRef
    >;
    // use example data from: https://docs.github.com/de/rest/git/refs?apiVersion=2026-03-10
    mockedGetRef.mockResolvedValue({
      data: {
        ref: "refs/heads/featureA",
        node_id: "MDM6UmVmcmVmcy9oZWFkcy9mZWF0dXJlQQ==",
        url: "https://api.github.com/repos/octocat/Hello-World/git/refs/heads/featureA",
        object: {
          sha: "aa218f56b14c9653891f9e74264a383fa43fefbd",
          type: "commit",
          url: "https://api.github.com/repos/octocat/Hello-World/git/commits/aa218f56b14c9653891f9e74264a383fa43fefbd"
        },
      },
      headers: { status: "200" },
      status: 200,
      url: "https://api.github.com/repos/octocat/Hello-World/git/ref/heads/featureA"
    });

    const result = await clientToTest.getRef(
      { owner: "octocat", repo: "Hello-World", branch: "featureA"});

    expect(mockedGetRef).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "octocat",
        repo: "Hello-World",
        ref: "heads/featureA"
      }));
    expect(result).toEqual({
      ref: "refs/heads/featureA",
      object: {
        sha: "aa218f56b14c9653891f9e74264a383fa43fefbd",
        type: "commit"
      }
    });
  });

  it("getRef should throw special error", async () => {
    const mockedGetRef = mockedOctokit.rest.git.getRef as jest.MockedFunction<
      typeof mockedOctokit.rest.git.getRef
    >;
    mockedGetRef.mockRejectedValue(new Error("Octokit REST-Client failed."))

    await expect(() => clientToTest.getRef({
        owner: "octocat", repo: "Hello-World", branch: "non-existend"
      })).rejects.toThrow(
        new SemanticReleaseError(
          "Failed to get ref for branch non-existend", 'EGHAPI', "Octokit REST-Client failed."
        ));
  });

  // createBlob
  it("createBlob should succeed", async () => {
    const mockedCreateBlob = mockedOctokit.rest.git.createBlob as jest.MockedFunction<
      typeof mockedOctokit.rest.git.createBlob
    >;
    // use example data from: https://docs.github.com/de/rest/git/blobs?apiVersion=2026-03-10#create-a-blob
    mockedCreateBlob.mockResolvedValue({
      data: {
        url: "https://api.github.com/repos/octocat/example/git/blobs/3a0f86fb8db8eea7ccbb9a95f325ddbedfb25e15",
        sha: "3a0f86fb8db8eea7ccbb9a95f325ddbedfb25e15",
      },
      headers: { status: "201" },
      status: 201,
      url: "https://api.github.com/repos/octocat/example/git/blobs"
    });

    const result = await clientToTest.createBlob(
      { owner: "octocat", repo: "example", branch: "featureA"},
      "Content of the blob", "utf-8"
    );

    expect(mockedCreateBlob).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "octocat",
        repo: "example",
        content: "Content of the blob",
        encoding: "utf-8"
      }));
    expect(result).toEqual({
      sha: "3a0f86fb8db8eea7ccbb9a95f325ddbedfb25e15",
      url: "https://api.github.com/repos/octocat/example/git/blobs/3a0f86fb8db8eea7ccbb9a95f325ddbedfb25e15"
    });
  });

  it("createBlob should throw special error", async () => {
    const mockedCreateBlob = mockedOctokit.rest.git.createBlob as jest.MockedFunction<
      typeof mockedOctokit.rest.git.createBlob
    >;
    mockedCreateBlob.mockRejectedValue(new Error("Octokit REST-Client failed."))

    await expect(() => clientToTest.createBlob({
        owner: "octocat", repo: "Hello-World", branch: "non-existend"
      }, "Content of the blob", "utf-8")).rejects.toThrow(
        new SemanticReleaseError(
          "Failed to create blob", 'EGHAPI', "Octokit REST-Client failed."
        ));
  });

  // createTree
  it("createTree should succeed", async () => {
    const mockedCreateTree = mockedOctokit.rest.git.createTree as jest.MockedFunction<
      typeof mockedOctokit.rest.git.createTree
    >;
    // use example data from: https://docs.github.com/de/rest/git/trees?apiVersion=2026-03-10#create-a-tree
    mockedCreateTree.mockResolvedValue({
      data: {
        sha: "cd8274d15fa3ae2ab983129fb037999f264ba9a7",
        url: "https://api.github.com/repos/octocat/Hello-World/trees/cd8274d15fa3ae2ab983129fb037999f264ba9a7",
        tree: [{
          path: "file.rb",
          mode: "100644",
          type: "blob",
          size: 132,
          sha: "7c258a9869f33c1e1e1f74fbb32f07c86cb5a75b",
          url: "https://api.github.com/repos/octocat/Hello-World/git/blobs/7c258a9869f33c1e1e1f74fbb32f07c86cb5a75b"
        }, {
          path: "",
          mode: "",
          type: "",
          sha: ""
        }],
        truncated: true
      },
      headers: { status: "201" },
      status: 201,
      url: "https://api.github.com/repos/octocat/Hello-World/git/trees"
    });

    const result = await clientToTest.createTree(
      { owner: "octocat", repo: "Hello-World", branch: "featureA"},
      "9fb037999f264ba9a7fc6274d15fa3ae2ab98312",
      [{ path: "file.rb", sha: "44b4fc6d56897b048c772eb4087f854f46256132" }]
    );

    expect(mockedCreateTree).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "octocat",
        repo: "Hello-World",
        base_tree: "9fb037999f264ba9a7fc6274d15fa3ae2ab98312",
        tree: expect.arrayContaining([
          expect.objectContaining({
            path: "file.rb",
            mode: "100644",
            type: "blob",
            sha: "44b4fc6d56897b048c772eb4087f854f46256132"
          })
        ])
      }));
    expect(result).toEqual({
      sha: "cd8274d15fa3ae2ab983129fb037999f264ba9a7",
      tree: [{
        path: "file.rb",
        mode: "100644",
        type: "blob",
        sha: "7c258a9869f33c1e1e1f74fbb32f07c86cb5a75b"
      }, {
        path: "",
        mode: "",
        type: "",
        sha: ""
      }],
      url: "https://api.github.com/repos/octocat/Hello-World/trees/cd8274d15fa3ae2ab983129fb037999f264ba9a7"
    });
  });

  it("createTree should throw special error", async () => {
    const mockedCreateTree = mockedOctokit.rest.git.createTree as jest.MockedFunction<
      typeof mockedOctokit.rest.git.createTree
    >;
    mockedCreateTree.mockRejectedValue(new Error("Octokit REST-Client failed."))

    await expect(() => clientToTest.createTree({
        owner: "octocat", repo: "Hello-World", branch: "non-existend"
      }, "wrongSHA", [{ path: "file.rb", sha: "fileSHA" }])).rejects.toThrow(
        new SemanticReleaseError(
          "Failed to create tree", 'EGHAPI', "Octokit REST-Client failed."
        ));
  });

  // getCommit
  it("getCommit should succeed", async () => {
    const mockedGetCommit = mockedOctokit.rest.git.getCommit as jest.MockedFunction<
      typeof mockedOctokit.rest.git.getCommit
    >;
    // use example data from: https://docs.github.com/de/rest/git/commits?apiVersion=2026-03-10#get-a-commit-object
    mockedGetCommit.mockResolvedValue({
      data: {
        sha: "7638417db6d59f3c431d3e1f261cc637155684cd",
        node_id: "MDY6Q29tbWl0NmRjYjA5YjViNTc4NzVmMzM0ZjYxYWViZWQ2OTVlMmU0MTkzZGI1ZQ==",
        url: "https://api.github.com/repos/octocat/Hello-World/git/commits/7638417db6d59f3c431d3e1f261cc637155684cd",
        html_url: "https://github.com/octocat/Hello-World/commit/7638417db6d59f3c431d3e1f261cc637155684cd",
        author: {
          date: "2014-11-07T22:01:45Z",
          name: "Monalisa Octocat",
          email: "octocat@github.com"
        },
        committer: {
          date: "2014-11-07T22:01:45Z",
          name: "Monalisa Octocat",
          email: "octocat@github.com"
        },
        message: "added readme, because im a good github citizen",
        tree: {
          url: "https://api.github.com/repos/octocat/Hello-World/git/trees/691272480426f78a0138979dd3ce63b77f706feb",
          sha: "691272480426f78a0138979dd3ce63b77f706feb"
        },
        parents: [{
          url: "https://api.github.com/repos/octocat/Hello-World/git/commits/1acc419d4d6a9ce985db7be48c6349a0475975b5",
          sha: "1acc419d4d6a9ce985db7be48c6349a0475975b5",
          html_url: "https://github.com/octocat/Hello-World/commit/7638417db6d59f3c431d3e1f261cc637155684cd",
        }],
        verification: {
          verified: false,
          reason: "unsigned",
          signature: null,
          payload: null,
          verified_at: null
        }
      },
      headers: { status: "200" },
      status: 200,
      url: "https://api.github.com//repos/octocat/Hello-World/git/commits/7638417db6d59f3c431d3e1f261cc637155684cd"
    });

    const result = await clientToTest.getCommit(
      { owner: "octocat", repo: "Hello-World", branch: "featureA"},
      "7638417db6d59f3c431d3e1f261cc637155684cd"
    );

    expect(mockedGetCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "octocat",
        repo: "Hello-World",
        commit_sha: "7638417db6d59f3c431d3e1f261cc637155684cd"
      }));
    expect(result).toEqual({
      sha: "7638417db6d59f3c431d3e1f261cc637155684cd",
      url: "https://api.github.com/repos/octocat/Hello-World/git/commits/7638417db6d59f3c431d3e1f261cc637155684cd",
      message: "added readme, because im a good github citizen",
      tree: {
        sha: "691272480426f78a0138979dd3ce63b77f706feb",
      },
      parents: [
        { sha: "1acc419d4d6a9ce985db7be48c6349a0475975b5" }
      ]
    });
  });

  it("getCommit should throw special error", async () => {
    const mockedGetCommit = mockedOctokit.rest.git.getCommit as jest.MockedFunction<
      typeof mockedOctokit.rest.git.getCommit
    >;
    mockedGetCommit.mockRejectedValue(new Error("Octokit REST-Client failed."))

    await expect(() => clientToTest.getCommit({
        owner: "octocat", repo: "Hello-World", branch: "non-existend"
      }, "wrongSHA")).rejects.toThrow(
        new SemanticReleaseError(
          "Failed to get commit wrongSHA", 'EGHAPI', "Octokit REST-Client failed."
        ));
  });

  // createCommit
  it("createCommit should succeed", async () => {
    const mockedCreateCommit = mockedOctokit.rest.git.createCommit as jest.MockedFunction<
      typeof mockedOctokit.rest.git.createCommit
    >;
    // use example data from: https://docs.github.com/de/rest/git/commits?apiVersion=2026-03-10#create-a-commit
    mockedCreateCommit.mockResolvedValue({
      data: {
        sha: "7638417db6d59f3c431d3e1f261cc637155684cd",
        node_id: "MDY6Q29tbWl0NzYzODQxN2RiNmQ1OWYzYzQzMWQzZTFmMjYxY2M2MzcxNTU2ODRjZA==",
        url: "https://api.github.com/repos/octocat/Hello-World/git/commits/7638417db6d59f3c431d3e1f261cc637155684cd",
        html_url: "https://github.com/octocat/Hello-World/commit/7638417db6d59f3c431d3e1f261cc637155684cd",
        author: {
          date: "2014-11-07T22:01:45Z",
          name: "Monalisa Octocat",
          email: "octocat@github.com"
        },
        committer: {
          date: "2014-11-07T22:01:45Z",
          name: "Monalisa Octocat",
          email: "octocat@github.com"
        },
        message: "my commit message",
        tree: {
          url: "https://api.github.com/repos/octocat/Hello-World/git/trees/827efc6d56897b048c772eb4087f854f46256132",
          sha: "827efc6d56897b048c772eb4087f854f46256132"
        },
        parents: [{
          url: "https://api.github.com/repos/octocat/Hello-World/git/commits/7d1b31e74ee336d15cbd21741bc88a537ed063a0",
          sha: "7d1b31e74ee336d15cbd21741bc88a537ed063a0",
          html_url: "https://github.com/octocat/Hello-World/commit/7d1b31e74ee336d15cbd21741bc88a537ed063a0",
        }],
        verification: {
          verified: false,
          reason: "unsigned",
          signature: null,
          payload: null,
          verified_at: null
        }
      },
      headers: { status: "201" },
      status: 201,
      url: "https://api.github.com//repos/octocat/Hello-World/git/commits"
    });

    const result = await clientToTest.createCommit(
      { owner: "octocat", repo: "Hello-World", branch: "featureA"},
      "my commit message",
      "827efc6d56897b048c772eb4087f854f46256132",
      ["7d1b31e74ee336d15cbd21741bc88a537ed063a0"],
      { name: "Monalisa Octocat", email: "octocat@github.com" },
      { name: "Monalisa Octocat", email: "octocat@github.com" }
    );

    expect(mockedCreateCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "octocat",
        repo: "Hello-World",
        message: "my commit message",
        tree: "827efc6d56897b048c772eb4087f854f46256132",
        parents: expect.arrayContaining(["7d1b31e74ee336d15cbd21741bc88a537ed063a0"]),
        author: expect.objectContaining(
          { name: "Monalisa Octocat", email: "octocat@github.com" }),
        committer: expect.objectContaining(
          { name: "Monalisa Octocat", email: "octocat@github.com" })
      }));
    expect(result).toEqual({
      sha: "7638417db6d59f3c431d3e1f261cc637155684cd",
      url: "https://api.github.com/repos/octocat/Hello-World/git/commits/7638417db6d59f3c431d3e1f261cc637155684cd",
      message: "my commit message",
      tree: {
        sha: "827efc6d56897b048c772eb4087f854f46256132",
      },
      parents: [
        { sha: "7d1b31e74ee336d15cbd21741bc88a537ed063a0" }
      ]
    });
  });

  it("createCommit should throw special error", async () => {
    const mockedCreateCommit = mockedOctokit.rest.git.createCommit as jest.MockedFunction<
      typeof mockedOctokit.rest.git.createCommit
    >;
    mockedCreateCommit.mockRejectedValue(new Error("Octokit REST-Client failed."))

    await expect(() => clientToTest.createCommit({
        owner: "octocat", repo: "Hello-World", branch: "non-existend"
      }, "message", "wrongTreeSHA", ["wrongParentSHA"])).rejects.toThrow(
        new SemanticReleaseError(
          "Failed to create commit", 'EGHAPI', "Octokit REST-Client failed."
        ));
  });

  // updateRef
  it("updateRef should succeed", async () => {
    const mockedUpdateRef = mockedOctokit.rest.git.updateRef as jest.MockedFunction<
      typeof mockedOctokit.rest.git.updateRef
    >;
    // use example data from: https://docs.github.com/de/rest/git/refs?apiVersion=2026-03-10#update-a-reference
    mockedUpdateRef.mockResolvedValue({
      data: {
        ref: "refs/heads/featureA",
        node_id: "MDM6UmVmcmVmcy9oZWFkcy9mZWF0dXJlQQ==",
        url: "https://api.github.com/repos/octocat/Hello-World/git/refs/heads/featureA",
        object: {
          sha: "aa218f56b14c9653891f9e74264a383fa43fefbd",
          type: "commit",
          url: "https://api.github.com/repos/octocat/Hello-World/git/commits/aa218f56b14c9653891f9e74264a383fa43fefbd"
        },
      },
      headers: { status: "200" },
      status: 200,
      url: "https://api.github.com/repos/octocat/Hello-World/git/refs/heads/featureA"
    });

    await expect(clientToTest.updateRef(
      { owner: "octocat", repo: "Hello-World", branch: "featureA"},
      "aa218f56b14c9653891f9e74264a383fa43fefbd"
    )).resolves.not.toThrow();

    expect(mockedUpdateRef).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "octocat",
        repo: "Hello-World",
        ref: "heads/featureA",
        sha: "aa218f56b14c9653891f9e74264a383fa43fefbd",
        force: false
      }));
  });

  it("updateRef should throw special error", async () => {
    const mockedUpdateRef = mockedOctokit.rest.git.updateRef as jest.MockedFunction<
      typeof mockedOctokit.rest.git.updateRef
    >;
    mockedUpdateRef.mockRejectedValue(new Error("Octokit REST-Client failed."))

    await expect(() => clientToTest.updateRef({
        owner: "octocat", repo: "Hello-World", branch: "non-existend"
      }, "wrongSHA")).rejects.toThrow(
        new SemanticReleaseError(
          "Failed to update ref heads/non-existend to wrongSHA", 'EGHAPI', "Octokit REST-Client failed."
        ));
  });
});