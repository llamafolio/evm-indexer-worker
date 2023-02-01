<h1 align="center">
<strong>Cloudflare Worker for the EVM Indexer</strong>
</h1>
<p align="center">
<strong>Middleware for simple API endpoints for the EVM Indexer Graphql API</strong>
</p>

This worker is a middleware between the GraphQL API from the EVM Indexer Hasura Cloud and the end user.

While Hasura Cloud is able to create multiple queries for different data from the indexer, this worker simplifies it by creating common queries and exposing them through a Cloudflare Worker.



## Requirements

- [Node](https://nodejs.org/en/)
- [Wrangler](https://github.com/cloudflare/wrangler2)

Before starting, you must have logged in into cloudflare using wrangler.

## Installation

1. Clone the repository

```
git clone https://github.com/llamafolio/evm-indexer-worker && cd evm-indexer-worker
```

2. Set the Hasura key from the evm-indexer .env file.

```
wrangler secret put HASURA_KEY
```

Write the Hasura Cloud key into the console.

3. Set the Hasura API url to the worker.

```
wrangler secret put HASURA_API_URL
```

Write the Hasura API url to the console.

4. Start de worker in local mode.

```
yarn start
```

for production

```
yarn deploy
```