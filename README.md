# Request Pool

Creates a pool of request.

## Features

- [Axios](https://www.npmjs.com/package/axios) based request pool
- Support for all axios request types.

## Example

```js
import { RequestPool } from '@cluelesscoders/request-pool';

const targets = [
    { url: 'http://testurl1/', method: 'GET' },
    { url: 'http://testurl2/', method: 'GET' },
    { url: 'http://testurl3/', method: 'POST', data: { test: 'data' } },
];

// limit two request at a time
const poolSize = 2;

const reqPool = new RequestPool(targets, poolSize);

// Get all responses including the failures
const responses = await reqPool.start();
```
