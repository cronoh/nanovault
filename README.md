# BananoVault

BananoVault is a fully client-side signing wallet for sending and receiving [Banano](https://github.com/bananocoin/banano)
on your [desktop](https://github.com/bananocoin/bananovault/releases) or [in your browser](https://vault.banano.cc)

![BananoVault Screenshot](https://i.imgur.com/DWlPQdM.png)
___

# Table of Contents
* [Install](#install-bananovault)
* [Bugs/Feedback](#bugsfeedback)
* [Application Structure](#application-structure)
* [Development Prerequisites](#development-prerequisites)
* [Development Guide](#development-guide)
* [Acknowledgements](#acknowledgements)


# Install BananoVault
BananoVault is available on your desktop (Windows/Mac/Linux) - just head over to the [releases section](https://github.com/bananocoin/bananovault/releases) and download the latest version for your OS.

You can also use BananoVault from any device on the web at [vault.banano.cc](https://vault.banano.cc)


# Bugs/Feedback
If you run into any issues, please use the [GitHub Issue Tracker](https://github.com/bananocoin/bananovault/issues) or head over to our [Discord Server](https://discord.gg/SBPaSBS)!
We are continually improving and adding new features based on the feedback you provide, so please let your opinions be known!

To get an idea of some of the things that are planned for the near future, check out the [Road Map](https://github.com/bananocoin/bananovault/wiki/Road-Map).

___

#### Everything below is only for contributing to the development of BananoVault
#### To download BananoVault go to the [releases section](https://github.com/bananocoin/bananovault/releases), or use the web wallet at [vault.banano.cc](https://vault.banano.cc)

___

# Application Structure

The application is broken into a few separate pieces:

- [BananoVault](https://github.com/bananocoin/bananovault) - The main wallet application (UI + Seed Generation/Block Signing/Etc).
- [BananoVault-Server](https://github.com/bananocoin/bananovault-server) - Serves the Wallet UI and brokers public communication between the wallet and the Banano Node.
- [BananoVault-WS](https://github.com/bananocoin/bananovault-ws) - Websocket server that receives new blocks from the Banano node and sends them in real time to the wallet ui.


# Development Prerequisites
- Node Package Manager: [Install NPM](https://www.npmjs.com/get-npm)
- Angular CLI: `npm install -g @angular/cli`


# Development Guide
#### Clone repository and install dependencies
```bash
git clone https://github.com/bananocoin/bananovault
cd bananovault
npm install
```

#### Run the wallet in dev mode (use http://localhost:4200)
```bash
npm run wallet:dev
```

#### Run the wallet in dev mode with ledger support (use https://localhost:4200, and ignore the ssl cert error)
```bash
npm run wallet:dev-ssl
```

## Build Wallet (For Production)
Build a production version of the wallet for web:
```bash
npm run wallet:build
```

Build a production version of the wallet for desktop: *(Required for all desktop builds)*
```bash
npm run wallet:build-desktop
```

## Desktop Builds

*All desktop builds require that you have built a desktop version of the wallet before running!*

Run the desktop wallet in dev mode:
```bash
npm run desktop:dev
```

Build the desktop wallet for your local OS (Will be in `dist-desktop`):
```bash
npm run desktop:local
```

Build the desktop wallet for Windows+Mac+Linux (May require dependencies for your OS [View them here](https://www.electron.build/multi-platform-build)):
```bash
npm run desktop:full
```

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

# Acknowledgements
Special thanks to the following!
- [cronoh/nanovault](https://github.com/cronoh) - Creator of nanovault
- [numtel/nano-webgl-pow](https://github.com/numtel/nano-webgl-pow) - WebGL PoW Implementation
- [jaimehgb/RaiBlocksWebAssemblyPoW](https://github.com/jaimehgb/RaiBlocksWebAssemblyPoW) - CPU PoW Implementation
- [dcposch/blakejs](https://github.com/dcposch/blakejs) - Blake2b Implementation
- [dchest/tweetnacl-js](https://github.com/dchest/tweetnacl-js) - Cryptography Implementation

 If you have found BananoVault useful and are feeling generous, you can donate to the original author's nano address: `xrb_318syypnqcgdouy3p3ekckwmnmmyk5z3dpyq48phzndrmmspyqdqjymoo8hj`
