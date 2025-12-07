<h1>SeaTable HTML Page SDK</h1>

<div>

[![npm package](https://img.shields.io/npm/v/seatable-html-page-sdk/latest.svg)](https://www.npmjs.org/package/seatable-html-page-sdk)
[![JS size](https://img.badgesize.io/https://unpkg.com/seatable-html-page-sdk@latest/dist/index.js?label=index.js)](https://unpkg.com/seatable-html-page-sdk@latest/dist/index.js)

</div>

## Introduction

SeaTable HTML Page SDK is a JavaScript library designed for embedding HTML pages within SeaTable Universal Apps. It provides commonly used interfaces for data interaction and event subscription, supporting both iframe environments (production) and standalone development modes (mock).

## Installation

Install with npm or yarn:

```bash
# npm
$ npm install seatable-html-page-sdk --save

# yarn
$ yarn add seatable-html-page-sdk
```

## Usage

### Initialization options

#### Development mode (mock)

For local development:

```js
const sdk = new HTMLPageSDK({
  isMock: true, // Force mock mode
  server: "https://your-seatable-server.com",
  accessToken: "your-access-token",
  appUuid: "your-app-uuid",
  username: "your-username",
  password: "your-password",
  appConfig: {
    /* your app config */
  },
});
```

In mock mode, you can access the underlying API clients:

```js
const mockAdapter = sdk.adapter;

// Access Universal App API
const metadata = await mockAdapter.universalAppAPI.getMetadata(appUuid);

// Access DTable Web API
await mockAdapter.dtableWebAPI.login();
```

#### Production mode (iframe)

When running inside a SeaTable Universal App:

```js
const sdk = new HTMLPageSDK({
  targetOrigin: "https://your-seatable-server.com", // Optional, defaults to '*'
  timeout: 10000, // Optional, request timeout in ms, defaults to 10000
});
```

### Basic usage

```js
import { HTMLPageSDK } from "seatable-html-page-sdk";

// Initialize SDK
const sdk = new HTMLPageSDK(options);

// Fetch data
const rows = await sdk.getRows("TableName", 0, 100);

// Add a new row
await sdk.addRow("TableName", { Name: "John", Age: 30 });

// Subscribe to app changes
const unsubscribe = sdk.subscribeAppChanged((eventType, updates) => {
  console.log("App changed:", eventType, updates);
});
```

## Testing

### Run tests

```bash
npm test
```

### Test coverage

```bash
npm run test-cov
```

## Development

### Build

```bash
npm run build
```

### Lint

```bash
# Check code style
npm run eslint

# Auto-fix issues
npm run eslint-fix
```
