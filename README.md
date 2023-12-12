# Elytra

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/dannytech/Elytra/tree/dev.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/gh/dannytech/Elytra/tree/dev)
[![codecov](https://codecov.io/gh/dannytech/Elytra/graph/badge.svg?token=929S4Y4LAN)](https://codecov.io/gh/dannytech/Elytra)

Elytra is a scalable Minecraft server written in TypeScript. Although the project is quite young, it is intended to be quite flexible, including distributed servers, a robust plugin API, and full concurrent support for multiple versions of Minecraft clients.

**Supported client versions: 1.15.2 (protocol version 578)**.

A small portion of the codebase was developed with assistance from AI tools, including GitHub Copilot, AWS CodeWhisperer, ChatGPT, and more. Some examples of code written with the help of these tools are tests and functions such as those in [WritableBuffer.ts](src/protocol/WritableBuffer.ts).

## Getting Started

Elytra uses a RethinkDB backend to store and interact with the server configuration and state. This allows many configuration options to be changed while the server is running, in addition to making it easier to store complex data structures like chunk data. RethinkDB also allows realtime game logic to be evaluated in a distributed manner within the database cluster. The simplest way to get started is to run the [`rethinkdb`](https://hub.docker.com/_/rethinkdb) Docker image and point this project to it. Setting up a RethinkDB server or cluster will not be covered here. Create a new file called `.env`, then add `RDB_URI=` and insert a URI with the format `rethinkdb://user:pass@host/db`.

Elytra targets the LTS version of NodeJS, and relies on experimental features not available in older versions. Once the environment is set up, either run `npm start` to build and start the server in production mode, or `npm run dev` to run a development server, which will restart on any changes. The first time the server is run, the EULA must be accepted using the GraphQL API and the server must be restarted. Docker images are available at `ghcr.io/dannytech/elytra`, but these track releases from the `main` branch, which lags significantly behind the development version.

### API

Elytra ships with a GraphQL API instead of a command-based administration interface, which can be used to modify settings, disconnect clients, view player properties, and more. The GraphQL API listens on port 25575 by default, although this can be modified after starting the server. After the server has started, visit `http://<your-ip>:25575/graphql` to access the GraphiQL interface and discover the available queries and mutations. This API should not be exposed directly to the internet!

## Contributing

If anyone is interested in contributing, please feel free to submit issues or PRs, especially ones related to the roadmap below, to fix issues I missed, or to improve the quality of the code. I work on this project in my free time, I am not a software engineer by trade, and do not expect to get much farther than loading into a basic world, but life can be surprising sometimes.

Files for devcontainers (for use with VS Code and Docker or GitHub Codespaces) and VS Code debugging are included. There is also an ESLint configuration to enforce some simple styling rules, and these have actually fixed a [couple](https://github.com/dannytech/Elytra/commit/beb2b61ede11f690483fb0c95578e7ed9f5b1bee) [issues](https://github.com/dannytech/Elytra/commit/fa26c72ad69710c189af1c542c0a301697cd83d3#diff-c1e0d9ec51f0aca5701443f8426832cd9aeac7dca5354a2a7483e587af85631cL109) in the past. Consider setting the `LOGGING` environment variable (via `.env`) to `debug` or `trace` for more details, including logging packet contents in the case of the latter option.

## Roadmap

There are many features still to implement, including something more than just a protocol implementation.

- [X] Protocol encryption, authentication, and compression
- [X] Chat
- [ ] Client states
    - [X] Handshaking
    - [X] Status
    - [X] Login
    - [ ] Play
- [ ] Support for multiple protocol and game versions
    - [X] Per-version packet ID mapping (accomplished via reflective packet class loading)
    - [ ] Block and item masking (if a block or item is not supported in a particular version, mocking invalid blocks to achieve similar aesthetics and functionality)
    - [ ] Pre- and post-1.9 combat
- [X] Automated testing
- [ ] Full-featured GraphQL API for server management
- [ ] World generation and loading
- [ ] Entities
- [ ] Tile entities
- [ ] NBT
- [ ] TS/JS plugin API
