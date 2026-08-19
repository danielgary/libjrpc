# Migrating to 0.3

Version 0.3 aligns the public TypeScript API with the JSON-RPC 2.0 wire contract. The runtime entry point still accepts
`unknown` so transports can pass decoded request bodies directly, but exported request and response types are now
strict protocol shapes.

## Handler types

`JRPCMethod` accepts optional params, result, and context type arguments and supports synchronous and asynchronous
returns:

```ts
type Context = { accountId: string }
type Params = { name: string }

const greet: JRPCMethod<Params, string, Context> = (params, context) =>
	`Hello ${params.name} from ${context?.accountId ?? 'anonymous'}`

const server = createJRPCServer<Context>({ greet })
```

Params, results, and `JRPCError.data` must be JSON-compatible. Void handler results are emitted as JSON `null`.

## Request and response types

- `jsonrpc` is the literal type `"2.0"`.
- `id` is required for `JRPCCall` and absent for `JRPCNotification`.
- `params` is optional and must be positional JSON values or a named JSON object.
- `JRPCSuccessResponse` requires `result` and excludes `error`.
- `JRPCErrorResponse` requires `error` and excludes `result`.
- `JRPCResponse` represents a single response, a batch response, or `undefined` for notifications.

`handleRequest` overloads narrow the return type for known calls, notifications, non-empty batches, and empty batches.

## Method discovery

The server no longer mutates the supplied method object or automatically exposes its method names. Pass
`{ enableDiscovery: true }` as the second argument to retain the legacy `rpc_discover` method. This compatibility method
returns the registered method names; it is not an OpenRPC service-discovery document.
