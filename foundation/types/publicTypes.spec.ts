import {
	createJRPCServer,
	JRPCCall,
	JRPCError,
	JRPCMethod,
	JRPCResponseBody,
	JRPCSuccessResponse,
	JSONValue
} from '../../index'
import { describe, expect, it } from 'vitest'

function expectType<T>(_value: T): void {
	return
}

describe('public types', () => {
	it('supports generic sync and async methods with typed context', async () => {
		type Context = { prefix: string }
		type Params = { values: JSONValue[] }

		const syncMethod: JRPCMethod<Params, number, Context> = (params, context) =>
			params.values.length + (context?.prefix.length ?? 0)
		const asyncMethod: JRPCMethod<undefined, string, Context> = async (_params, context) => context?.prefix ?? ''
		const server = createJRPCServer<Context>({ asyncMethod, syncMethod })

		expectType<Promise<JRPCResponseBody>>(
			server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'syncMethod', params: { values: [] } }, { prefix: 'x' })
		)
		expectType<Promise<undefined>>(server.handleRequest({ jsonrpc: '2.0', method: 'asyncMethod' }, { prefix: 'x' }))
		expectType<Promise<JRPCResponseBody[] | undefined>>(
			server.handleRequest([{ id: 1, jsonrpc: '2.0', method: 'asyncMethod' }], { prefix: 'x' })
		)

		// @ts-expect-error Context values must match the server's context type.
		void server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'asyncMethod' }, { prefix: 1 })

		expect(await syncMethod({ values: [] }, { prefix: 'x' })).toBe(1)
	})

	it('makes success and error responses mutually exclusive', () => {
		const success: JRPCSuccessResponse = { id: 1, jsonrpc: '2.0', result: null }
		const error: JRPCResponseBody = {
			error: new JRPCError(1234, 'failure'),
			id: 1,
			jsonrpc: '2.0'
		}

		// @ts-expect-error Responses cannot contain both result and error.
		const invalid: JRPCResponseBody = { error: new JRPCError(1234), id: 1, jsonrpc: '2.0', result: null }
		// @ts-expect-error Requests must use the JSON-RPC 2.0 literal.
		const invalidCall: JRPCCall = { id: 1, jsonrpc: '1.0', method: 'invalid' }
		// @ts-expect-error Method results must be JSON-compatible.
		const invalidMethod: JRPCMethod = () => new Date()
		void invalid
		void invalidCall
		void invalidMethod

		expect(success.result).toBeNull()
		expect(error.error).toBeInstanceOf(JRPCError)
	})
})
