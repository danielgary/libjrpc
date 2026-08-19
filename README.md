# libjrpc

A small, transport-agnostic JSON-RPC 2.0 server for Node.js. It has no runtime dependencies and works with any HTTP,
WebSocket, queue, or in-process transport that can provide a decoded request value.

## Install

```sh
npm install libjrpc
```

## Create a server

Methods may return synchronously or asynchronously. Params, results, and `JRPCError.data` must be JSON-compatible.

```ts
import { createJRPCServer, JRPCError, JRPCMethod } from 'libjrpc'

type RequestContext = {
	accountId: string
}

type AddParams = {
	left: number
	right: number
}

const add: JRPCMethod<AddParams, number, RequestContext> = (params) => params.left + params.right

const audit: JRPCMethod<{ event: string }, void, RequestContext> = (_params, _context) => {
	// A void result is emitted as JSON null for calls and omitted for notifications.
}

const fail: JRPCMethod<undefined, never, RequestContext> = () => {
	throw new JRPCError(1001, 'The operation was rejected', { retryable: false })
}

export const server = createJRPCServer<RequestContext>(
	{ add, audit, fail },
	{
		onError(error, { context, request }) {
			console.error('Unexpected RPC failure', { accountId: context?.accountId, error, method: request.method })
		}
	}
)
```

The same source is available as [examples/basic.ts](examples/basic.ts) and is compiled by the project build.

## Connect a transport

`handleRequest` accepts an already-decoded `unknown` value. Send its result directly as the JSON-RPC response body;
do not wrap it in another object. A result of `undefined` means the input was a notification and the transport should
send no JSON body.

```ts
type ExpressLikeRequest = { body: unknown }
type ExpressLikeResponse = {
	end(): void
	json(body: unknown): void
	status(code: number): ExpressLikeResponse
}

export async function jsonRpcEndpoint(
	req: ExpressLikeRequest,
	res: ExpressLikeResponse,
	context: RequestContext
): Promise<void> {
	const response = await server.handleRequest(req.body, context)

	if (response === undefined) {
		res.status(204).end()
		return
	}

	res.status(200).json(response)
}
```

See [examples/http.ts](examples/http.ts) for this adapter and a raw-text helper. JSON parsing belongs to the transport;
if parsing fails, it should return a `-32700 Parse error` response with `id: null`. Malformed decoded values passed to
`handleRequest` are returned as `-32600 Invalid Request` responses rather than thrown exceptions.

## Call from a client

The response is read directly from the body, matching the server adapter above:

```ts
export async function call<TResult extends JSONValue>(
	url: string,
	method: string,
	params?: JRPCParams
): Promise<TResult> {
	const id = nextId++
	const response = await fetch(url, {
		body: JSON.stringify({ id, jsonrpc: '2.0', method, params }),
		headers: { 'content-type': 'application/json' },
		method: 'POST'
	})
	const body = (await response.json()) as ClientResponse<TResult>

	if ('error' in body) {
		throw new RemoteJRPCError(body.error.code, body.error.message, body.error.data)
	}

	return body.result
}
```

The complete typed client, including its response and error definitions, is in [examples/client.ts](examples/client.ts).

## Calls and notifications

A call includes an `id` and receives a response:

```json
{ "jsonrpc": "2.0", "id": "add-1", "method": "add", "params": { "left": 20, "right": 22 } }
```

```json
{ "jsonrpc": "2.0", "id": "add-1", "result": 42 }
```

A notification omits the `id`. Its method is executed, but `handleRequest` returns `undefined`, even when execution
fails:

```json
{ "jsonrpc": "2.0", "method": "audit", "params": { "event": "signed-in" } }
```

Included IDs such as `0`, `""`, and `null` are calls, not notifications.

## Batch requests

Pass an array to execute a batch. Calls produce response entries while notifications are omitted. A batch containing
only notifications returns `undefined`; an empty batch returns one Invalid Request response.

```ts
const response = await server.handleRequest(
	[
		{ id: 1, jsonrpc: '2.0', method: 'add', params: { left: 2, right: 3 } },
		{ jsonrpc: '2.0', method: 'audit', params: { event: 'calculated' } }
	],
	{ accountId: 'account-1' }
)
// [{ jsonrpc: '2.0', id: 1, result: 5 }]
```

Batch methods may run concurrently. Match responses to calls by `id`, not array position.

## Errors

Throw `JRPCError` for expected application failures. Its integer code, message, and optional JSON-compatible data are
sent to the client. Other thrown values become a generic `-32603 Internal error`; their details are available only to
the optional `onError` callback. Errors from that callback never alter the RPC response.

Void method results become JSON `null`. By default, unsupported results such as `bigint`, functions, symbols,
non-finite numbers, class instances, and cyclic objects become Internal error responses.

### Optional result serialization

Enable standard JSON serialization when handlers return values such as `Date` instances or objects with `toJSON`
methods:

```ts
import { createJRPCServer, jsonSerializer } from 'libjrpc'

const server = createJRPCServer(
	{
		currentTime: async () => ({ createdAt: new Date() })
	},
	{ serializeResult: jsonSerializer }
)
```

The serializer runs after the handler resolves and before the result is validated. Dates become ISO strings, custom
`toJSON` methods are honored, undefined object properties are omitted, and non-finite numbers become JSON `null`.
Values that `JSON.stringify` cannot serialize, including `bigint` and cyclic objects, become Internal error responses.

## Method discovery

Method discovery is disabled by default. Enable the legacy method-name list explicitly:

```ts
const discoverableServer = createJRPCServer({ add }, { enableDiscovery: true })
```

This adds `rpc_discover`; it returns registered method names and is not an OpenRPC discovery document.

## TypeScript API

The package exports typed calls, notifications, params, responses, errors, methods, server options, and JSON values.
`handleRequest` has overloads for calls, notifications, empty batches, and non-empty batches while retaining an
`unknown` boundary for transport input.

See [MIGRATING.md](MIGRATING.md) for the breaking type and behavior changes planned for version 0.3.

## License

MIT
