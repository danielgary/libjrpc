import { createJRPCServer, JRPCErrorCodes } from './index'

describe('createJRPCServer', () => {
	const createServer = () =>
		createJRPCServer({
			echo: async (params): Promise<unknown> => params,
			fail: async (): Promise<never> => {
				throw new Error('failure')
			}
		})

	it.each([0, '', null])('echoes the included request ID %p', async (id) => {
		const response = await createServer().handleRequest({ id, jsonrpc: '2.0', method: 'echo', params: ['value'] })

		expect(response).toEqual({ id, jsonrpc: '2.0', result: ['value'] })
	})

	it('executes a notification without returning a response', async () => {
		const echo = jest.fn(async (params): Promise<unknown> => params)
		const server = createJRPCServer({ echo })

		const response = await server.handleRequest({ jsonrpc: '2.0', method: 'echo', params: ['value'] })

		expect(response).toBeUndefined()
		expect(echo).toHaveBeenCalledWith(['value'], undefined)
	})

	it.each([
		{ jsonrpc: '2.0', method: 'missing', params: [] },
		{ jsonrpc: '2.0', method: 'fail', params: [] }
	])('does not return validation or execution errors for notifications', async (request) => {
		const response = await createServer().handleRequest(request)

		expect(response).toBeUndefined()
	})

	it('omits notifications from a mixed batch response', async () => {
		const response = await createServer().handleRequest([
			{ id: 1, jsonrpc: '2.0', method: 'echo', params: ['call'] },
			{ jsonrpc: '2.0', method: 'echo', params: ['notification'] }
		])

		expect(response).toEqual([{ id: 1, jsonrpc: '2.0', result: ['call'] }])
	})

	it('returns no response for an all-notification batch', async () => {
		const response = await createServer().handleRequest([
			{ jsonrpc: '2.0', method: 'echo', params: [1] },
			{ jsonrpc: '2.0', method: 'echo', params: [2] }
		])

		expect(response).toBeUndefined()
	})

	it('returns Invalid Request for an empty batch', async () => {
		const response = await createServer().handleRequest([])

		expect(response).toEqual({
			error: expect.objectContaining({ code: JRPCErrorCodes.INVALID_REQUEST, message: 'Invalid Request' }),
			id: null,
			jsonrpc: '2.0'
		})
	})

	it.each([null, true, 1, 'request'])('returns Invalid Request for malformed input %p', async (request) => {
		const response = await createServer().handleRequest(request)

		expect(response).toEqual({
			error: expect.objectContaining({ code: JRPCErrorCodes.INVALID_REQUEST }),
			id: null,
			jsonrpc: '2.0'
		})
	})

	it('returns an error response for each malformed batch member', async () => {
		const response = await createServer().handleRequest([null, 1, true])

		expect(response).toHaveLength(3)
		expect(response).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ error: expect.objectContaining({ code: JRPCErrorCodes.INVALID_REQUEST }) })
			])
		)
	})

	it('allows params to be omitted', async () => {
		const handler = jest.fn(async (params): Promise<unknown> => params)
		const server = createJRPCServer({ handler })

		const response = await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'handler' })

		expect(handler).toHaveBeenCalledWith(undefined, undefined)
		expect(response).toEqual({ id: 1, jsonrpc: '2.0', result: undefined })
	})

	it('rejects null params', async () => {
		const response = await createServer().handleRequest({ id: 1, jsonrpc: '2.0', method: 'echo', params: null })

		expect(response).toEqual({
			error: expect.objectContaining({ code: JRPCErrorCodes.INVALID_PARAMS }),
			id: 1,
			jsonrpc: '2.0'
		})
	})

	it.each(['toString', 'constructor', '__proto__'])('does not dispatch the inherited method %s', async (method) => {
		const server = createJRPCServer({})

		expect(server.getRequestHandler(method)).toBeUndefined()
		expect(await server.handleRequest({ id: 1, jsonrpc: '2.0', method })).toEqual({
			error: expect.objectContaining({ code: JRPCErrorCodes.METHOD_NOT_FOUND }),
			id: 1,
			jsonrpc: '2.0'
		})
	})

	it('returns Method not found for an unknown method', async () => {
		const response = await createServer().handleRequest({ id: 1, jsonrpc: '2.0', method: 'missing' })

		expect(response).toEqual({
			error: expect.objectContaining({ code: JRPCErrorCodes.METHOD_NOT_FOUND }),
			id: 1,
			jsonrpc: '2.0'
		})
	})

	it('uses a null response ID when the request ID is invalid', async () => {
		const response = await createServer().handleRequest({ id: false, jsonrpc: '2.0', method: 'echo' })

		expect(response).toEqual({
			error: expect.objectContaining({ code: JRPCErrorCodes.INVALID_REQUEST }),
			id: null,
			jsonrpc: '2.0'
		})
	})
})
