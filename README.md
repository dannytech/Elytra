# Elytra

Elytra is a lightweight Minecraft server written in TypeScript. Although the project is quite young, it is intended to be quite flexible, including distributed servers, a robust plugin API, and concurrent support for multiple versions of Minecraft clients.

**Supported client versions: 1.15.2 (protocol version 578)**.

## Getting Started

Elytra uses a MongoDB backend to store the server configuration and state. This allows many configuration options to be changed while the server is running, in addition to making it easier to store complex data structures like chunk data. The simplest way to get started is to run the [`mongo`](https://hub.docker.com/_/mongo) Docker image and point this project to it, or to use a service like [MongoDB Cloud](https://www.mongodb.com/cloud). Setting up a MongoDB server or cluster will not be covered here. Create a new file called `.env`, then add `MONGO_URI=` and paste the cluster connection URL.

From there, either run `yarn start` to build and start the server in production mode, or `yarn dev` to run a development server, which will restart on any changes. The first time the server is run, it will prompt to accept the EULA.

## Contributing

If anyone is interested in contributing, please let me know or feel free to submit issues or PRs, especially ones related to the below roadmap or to fix issues I missed. I work on this project in my free time, and do not expect to get much farther than loading into a basic world, but life can be surprising sometimes.

Files for devcontainers (for use with VS Code and Docker or GitHub Codespaces) and VS Code debugging are included. There is also an ESLint configuration to enforce some simple styling rules, and these have actually fixed a [couple](https://github.com/dannytech/Elytra/commit/beb2b61ede11f690483fb0c95578e7ed9f5b1bee) [issues](https://github.com/dannytech/Elytra/commit/fa26c72ad69710c189af1c542c0a301697cd83d3#diff-c1e0d9ec51f0aca5701443f8426832cd9aeac7dca5354a2a7483e587af85631cL109) in the past.

## Roadmap

There are many features still to implement, not the less something more than just a protocol implementation. This is a passion project, not something I think will ever be complete, so the below are just some goals I hope to eventually fulfill.

- [X] Protocol state management
- [X] Protocol encryption, authentication, and compression
- [X] Chat
- [] Client states
    - [X] Handshaking
    - [X] Status
    - [X] Login
    - [] Play
- [] Support for multiple protocol and game versions
    - [X] Per-version packet ID mapping (accomplished via reflective packet class loading)
    - [] Versioned packet ID mappings (either requires manual data entry or a scraping script)
    - [] Block and item masking (if a block or item is not supported in a particular version, telling those clients it's a similar block or item)
    - [] Pre- and post-1.9 combat
- [] World generation and loading
- [] Entities
- [] Tile entities
- [] NBT
- [] Plugin API
    - [] EventEmitters for most game components
