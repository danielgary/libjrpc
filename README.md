# libjrpc
Transport Agnostic JSON RPC Library


## The goal of libjrpc is to provide a JSON RPC Server implementation that can run in any Node environment
Here is a basic example of it running in an express-like environment

```js
import { createJRPCServer } from 'libjrpc';
const jrpcServer = createJRPCServer({
  'hello_world': (args, context) => {
    return 'Hello, world!'
  }
})

app.post('/api/jsonrpc', async (req, res) => {
  const response = await jrpcServer.handleRequest(req.body, context);
  res.json({data: response})
})

```

Here's a handy JSON RPC hook for react:
```jsx
import { useCallback, useState } from 'react'

export interface UseProcedureResult<TResult> {
	error: Error | null
	result: TResult | null
}

export interface UseProcedureHookResult<TParams, TResult> extends UseProcedureResult<TResult> {
	loading: boolean
	// eslint-disable-next-line no-unused-vars
	execute: (params: TParams, headers?: Record<string, string>) => Promise<UseProcedureResult<TResult>>
}

export const useProcedure = <TParams, TResult>(methodName: string): UseProcedureHookResult<TParams, TResult> => {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [result, setResult] = useState<TResult | null>(null)

	const execute = useCallback(
		async (params: TParams, headers: Record<string, string> = {}) => {
			const id = new Date().getTime()
			const body = {
				id,
				jsonrpc: '2.0',
				method: methodName,
				params
			}

			headers['Content-Type'] = 'application/json'

			setError(null)
			setLoading(true)

			try {
				const response = await fetch(`/api/jsonrpc`, { body: JSON.stringify(body), headers, method: 'POST' })
				const parsedResponse = await response.json()

				if (parsedResponse.error) {
					const error: Error = { message: parsedResponse.error.message, name: `JRPCError` }
					setError(error)
					return { error, result: null }
				} else {
					const result = parsedResponse.result as TResult
					setResult(result)
					return { error: null, result }
				}
			} catch (err) {
				setResult(null)
				setError(err)
				return { error: err, result: null }
			} finally {
				setLoading(false)
			}
		},
		[methodName, setLoading, setError, setResult]
	)

	return {
		error,
		execute,
		loading,
		result
	}
}

```

You can use it like this:
```jsx
const {execute, loading, error, result} = useProcedure('hello_world')

return ( 
  <div>
    <button onClick={()=>{execute({})}}>Execute</button>
      Result: {result}
    </div>
)
```