import {
	createJRPCServer,
	JRPCError,
	JRPCErrorCodes,
	JRPCNamedParams,
	JRPCPositionalParams,
	JRPCResponse,
	JSONValue
} from './index'
import { describe, expect, it } from 'vitest'

function toWireValue(response: JRPCResponse): JSONValue | undefined {
	return response === undefined ? undefined : JSON.parse(JSON.stringify(response))
}

function createConformanceServer() {
	const notifications: string[] = []
	const server = createJRPCServer({
		get_data: () => ['hello', 5],
		notify_hello: (params) => {
			notifications.push(`hello:${JSON.stringify(params)}`)
		},
		notify_sum: (params) => {
			notifications.push(`sum:${JSON.stringify(params)}`)
		},
		subtract: (params) => {
			if (Array.isArray(params)) {
				const [minuend, subtrahend] = params as JRPCPositionalParams
				return Number(minuend) - Number(subtrahend)
			}

			const named = params as JRPCNamedParams
			return Number(named.minuend) - Number(named.subtrahend)
		},
		sum: (params) => {
			if (!Array.isArray(params)) {
				throw new JRPCError(JRPCErrorCodes.INVALID_PARAMS, 'Invalid params')
			}

			return params.reduce<number>((total, value) => total + Number(value), 0)
		},
		update: (params) => {
			notifications.push(`update:${JSON.stringify(params)}`)
		}
	})

	return { notifications, server }
}

describe('JSON-RPC 2.0 conformance', () => {
	it.each([
		{ id: 1, params: [42, 23], result: 19 },
		{ id: 2, params: [23, 42], result: -19 }
	])('handles positional parameters for request $id', async ({ id, params, result }) => {
		const { server } = createConformanceServer()

		expect(toWireValue(await server.handleRequest({ id, jsonrpc: '2.0', method: 'subtract', params }))).toEqual({
			id,
			jsonrpc: '2.0',
			result
		})
	})

	it.each([
		{ id: 3, params: { minuend: 42, subtrahend: 23 } },
		{ id: 4, params: { subtrahend: 23, minuend: 42 } }
	])('handles named parameters for request $id', async ({ id, params }) => {
		const { server } = createConformanceServer()

		expect(toWireValue(await server.handleRequest({ id, jsonrpc: '2.0', method: 'subtract', params }))).toEqual({
			id,
			jsonrpc: '2.0',
			result: 19
		})
	})

	it('executes notifications without returning a response', async () => {
		const { notifications, server } = createConformanceServer()

		expect(await server.handleRequest({ jsonrpc: '2.0', method: 'update', params: [1, 2, 3, 4, 5] })).toBeUndefined()
		expect(await server.handleRequest({ jsonrpc: '2.0', method: 'foobar' })).toBeUndefined()
		expect(notifications).toEqual(['update:[1,2,3,4,5]'])
	})

	it('returns Method not found for a non-existent method', async () => {
		const { server } = createConformanceServer()

		expect(toWireValue(await server.handleRequest({ id: '1', jsonrpc: '2.0', method: 'foobar' }))).toEqual({
			error: { code: JRPCErrorCodes.METHOD_NOT_FOUND, message: 'Method not found' },
			id: '1',
			jsonrpc: '2.0'
		})
	})

	it('returns Invalid Request for an invalid request object', async () => {
		const { server } = createConformanceServer()

		expect(toWireValue(await server.handleRequest({ jsonrpc: '2.0', method: 1, params: 'bar' }))).toEqual({
			error: { code: JRPCErrorCodes.INVALID_REQUEST, message: 'Invalid Request' },
			id: null,
			jsonrpc: '2.0'
		})
	})

	it('returns a single Invalid Request response for an empty batch', async () => {
		const { server } = createConformanceServer()

		expect(toWireValue(await server.handleRequest([]))).toEqual({
			error: { code: JRPCErrorCodes.INVALID_REQUEST, message: 'Invalid Request' },
			id: null,
			jsonrpc: '2.0'
		})
	})

	it.each([{ batch: [1] }, { batch: [1, 2, 3] }])(
		'returns one Invalid Request response per invalid batch member',
		async ({ batch }) => {
			const { server } = createConformanceServer()
			const response = toWireValue(await server.handleRequest(batch))

			expect(response).toEqual(
				batch.map(() => ({
					error: { code: JRPCErrorCodes.INVALID_REQUEST, message: 'Invalid Request' },
					id: null,
					jsonrpc: '2.0'
				}))
			)
		}
	)

	it('handles mixed calls, notifications, and invalid batch members', async () => {
		const { notifications, server } = createConformanceServer()
		const response = toWireValue(
			await server.handleRequest([
				{ id: '1', jsonrpc: '2.0', method: 'sum', params: [1, 2, 4] },
				{ jsonrpc: '2.0', method: 'notify_hello', params: [7] },
				{ id: '2', jsonrpc: '2.0', method: 'subtract', params: [42, 23] },
				{ foo: 'boo' },
				{ id: '5', jsonrpc: '2.0', method: 'foo.get', params: { name: 'myself' } },
				{ id: '9', jsonrpc: '2.0', method: 'get_data' }
			])
		)

		expect(response).toEqual(
			expect.arrayContaining([
				{ id: '1', jsonrpc: '2.0', result: 7 },
				{ id: '2', jsonrpc: '2.0', result: 19 },
				{
					error: { code: JRPCErrorCodes.INVALID_REQUEST, message: 'Invalid Request' },
					id: null,
					jsonrpc: '2.0'
				},
				{
					error: { code: JRPCErrorCodes.METHOD_NOT_FOUND, message: 'Method not found' },
					id: '5',
					jsonrpc: '2.0'
				},
				{ id: '9', jsonrpc: '2.0', result: ['hello', 5] }
			])
		)
		expect(response).toHaveLength(5)
		expect(notifications).toEqual(['hello:[7]'])
	})

	it('returns nothing for an all-notification batch', async () => {
		const { notifications, server } = createConformanceServer()

		expect(
			await server.handleRequest([
				{ jsonrpc: '2.0', method: 'notify_sum', params: [1, 2, 4] },
				{ jsonrpc: '2.0', method: 'notify_hello', params: [7] }
			])
		).toBeUndefined()
		expect(notifications).toHaveLength(2)
		expect(notifications).toEqual(expect.arrayContaining(['sum:[1,2,4]', 'hello:[7]']))
	})
})
