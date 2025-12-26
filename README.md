<h1>SeaTable HTML Page SDK</h1>

<div>

[![npm package](https://img.shields.io/npm/v/seatable-html-page-sdk/latest.svg)](https://www.npmjs.org/package/seatable-html-page-sdk)
[![JS size](https://img.badgesize.io/https://unpkg.com/seatable-html-page-sdk@latest/dist/index.js?label=index.js)](https://unpkg.com/seatable-html-page-sdk@latest/dist/index.js)

</div>

## Introduction

SeaTable HTML Page SDK is a JavaScript library designed for embedding HTML pages within SeaTable Universal Apps. It provides commonly used interfaces for data interaction and event subscription.

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
  server: "https://your-seatable-server.com",
  accessToken: "your-access-token",
  appUuid: "your-app-uuid",
  pageId: "your-app-page-id", // create an html page in universal app first
});
await sdk.init({});
```

#### Production mode (iframe)

When running inside a SeaTable Universal App:

```js
const sdk = new HTMLPageSDK({
  targetOrigin: "https://your-seatable-server.com", // Optional, defaults to '*'
  timeout: 10000, // Optional, request timeout in ms, defaults to 10000
});
await sdk.init({});
```

### Basic usage

```js
import { HTMLPageSDK } from "seatable-html-page-sdk";

// Initialize SDK
const sdk = new HTMLPageSDK(options);
await sdk.init();

// list rows
const rows = await sdk.listRows({
  tableName: "TableName",
  start: 0,
  limit: 100,
});

// Add a new row
await sdk.addRow({
  tableName: "TableName",
  rowData: { Name: "John", Age: 30 },
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
