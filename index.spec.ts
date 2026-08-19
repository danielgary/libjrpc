import { createJRPCServer, JRPCError, JRPCErrorCodes, JRPCMethodMap } from './index'

describe('createJRPCServer', () => {
	const createServer = () =>
		createJRPCServer({
			echo: async (params) => params,
			fail: async (): Promise<never> => {
				throw new Error('failure')
			}
		})

	it.each([0, '', null])('echoes the included request ID %p', async (id) => {
		const response = await createServer().handleRequest({ id, jsonrpc: '2.0', method: 'echo', params: ['value'] })

		expect(response).toEqual({ id, jsonrpc: '2.0', result: ['value'] })
	})

	it('executes a notification without returning a response', async () => {
		const echo = jest.fn(async (params) => params)
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
		const handler = jest.fn(async (params) => params)
		const server = createJRPCServer({ handler })

		const response = await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'handler' })

		expect(handler).toHaveBeenCalledWith(undefined, undefined)
		expect(response).toEqual({ id: 1, jsonrpc: '2.0', result: null })
		expect(JSON.stringify(response)).toContain('"result":null')
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

	it('preserves deliberate application errors', async () => {
		const server = createJRPCServer({
			fail: async (): Promise<never> => {
				throw new JRPCError(1234, 'custom', { reason: 'expected' })
			}
		})

		const response = await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'fail' })

		expect(response).toEqual({
			error: expect.objectContaining({ code: 1234, data: { reason: 'expected' }, message: 'custom' }),
			id: 1,
			jsonrpc: '2.0'
		})
	})

	it.each([new Error('sensitive database details'), 'sensitive string', { secret: 'sensitive object' }])(
		'hides unexpected error details for %p',
		async (thrownValue) => {
			const server = createJRPCServer({
				fail: async (): Promise<never> => {
					throw thrownValue
				}
			})

			const response = await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'fail' })
			const serializedResponse = JSON.stringify(response)

			expect(response).toEqual({
				error: expect.objectContaining({ code: JRPCErrorCodes.INTERNAL_ERROR, message: 'Internal error' }),
				id: 1,
				jsonrpc: '2.0'
			})
			expect(serializedResponse).not.toContain('sensitive')
		}
	)

	it('does not echo invalid request bodies in error data', async () => {
		const response = await createServer().handleRequest({
			id: 1,
			jsonrpc: '1.0',
			method: 'echo',
			params: { password: 'do-not-echo' }
		})

		expect(JSON.stringify(response)).not.toContain('do-not-echo')
	})

	it('reports handler errors with request and server context', async () => {
		const error = new Error('failure')
		const onError = jest.fn()
		const request = { id: 1, jsonrpc: '2.0', method: 'fail' }
		const context = { traceId: 'trace-1' }
		const server = createJRPCServer(
			{
				fail: async (): Promise<never> => {
					throw error
				}
			},
			{ onError }
		)

		await server.handleRequest(request, context)

		expect(onError).toHaveBeenCalledWith(error, { context, request })
	})

	it('reports notification errors without returning a response', async () => {
		const onError = jest.fn()
		const request = { jsonrpc: '2.0', method: 'fail' }
		const server = createJRPCServer(
			{
				fail: async (): Promise<never> => {
					throw new Error('failure')
				}
			},
			{ onError }
		)

		const response = await server.handleRequest(request)

		expect(response).toBeUndefined()
		expect(onError).toHaveBeenCalledWith(expect.any(Error), { context: undefined, request })
	})

	it('ignores failures from the error hook', async () => {
		const server = createJRPCServer(
			{
				fail: async (): Promise<never> => {
					throw new Error('handler failure')
				}
			},
			{
				onError: async (): Promise<void> => {
					throw new Error('hook failure')
				}
			}
		)

		const response = await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'fail' })

		expect(response).toEqual({
			error: expect.objectContaining({ code: JRPCErrorCodes.INTERNAL_ERROR, message: 'Internal error' }),
			id: 1,
			jsonrpc: '2.0'
		})
	})

	it('returns nested JSON-compatible results', async () => {
		const result = { nested: { values: [1, 'two', true, null] } }
		const server = createJRPCServer({ result: async () => result })

		const response = await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'result' })

		expect(response).toEqual({ id: 1, jsonrpc: '2.0', result })
		expect(JSON.parse(JSON.stringify(response))).toEqual(response)
	})

	it.each([BigInt(1), Symbol('value'), () => undefined, new Date(), NaN, Infinity])(
		'returns Internal error for unsupported result %p',
		async (result) => {
			const onError = jest.fn()
			const server = createJRPCServer({ result: async (): Promise<any> => result }, { onError })

			const response = await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'result' })

			expect(response).toEqual({
				error: expect.objectContaining({ code: JRPCErrorCodes.INTERNAL_ERROR, message: 'Internal error' }),
				id: 1,
				jsonrpc: '2.0'
			})
			expect(onError).toHaveBeenCalledWith(expect.any(TypeError), expect.any(Object))
		}
	)

	it('returns Internal error for cyclic results', async () => {
		const result: { self?: unknown } = {}
		result.self = result
		const server = createJRPCServer({ result: async (): Promise<any> => result })

		const response = await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'result' })

		expect(response).toEqual({
			error: expect.objectContaining({ code: JRPCErrorCodes.INTERNAL_ERROR, message: 'Internal error' }),
			id: 1,
			jsonrpc: '2.0'
		})
	})

	it('does not mutate the supplied method registry', () => {
		const methods: JRPCMethodMap = { echo: async (params) => params }

		createJRPCServer(methods)

		expect(Object.keys(methods)).toEqual(['echo'])
		expect(methods).not.toHaveProperty('rpc_discover')
	})

	it('supports frozen method registries', async () => {
		const methods = Object.freeze<JRPCMethodMap>({ echo: async (params) => params })
		const server = createJRPCServer(methods)

		expect(await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'echo', params: ['value'] })).toEqual({
			id: 1,
			jsonrpc: '2.0',
			result: ['value']
		})
	})

	it('disables discovery by default', async () => {
		const server = createJRPCServer({ echo: async (params) => params })

		expect(server.getRequestHandler('rpc_discover')).toBeUndefined()
		expect(await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'rpc_discover' })).toEqual({
			error: expect.objectContaining({ code: JRPCErrorCodes.METHOD_NOT_FOUND }),
			id: 1,
			jsonrpc: '2.0'
		})
	})

	it('exposes the legacy discovery method when explicitly enabled', async () => {
		const server = createJRPCServer({ echo: async (params) => params }, { enableDiscovery: true })

		expect(await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'rpc_discover' })).toEqual({
			id: 1,
			jsonrpc: '2.0',
			result: ['echo', 'rpc_discover']
		})
	})

	it('rejects discovery method collisions', () => {
		expect(() => createJRPCServer({ rpc_discover: async () => [] }, { enableDiscovery: true })).toThrow(
			'Cannot enable discovery when rpc_discover is already registered'
		)
	})

	it('isolates the server from later caller registry changes', async () => {
		const methods: JRPCMethodMap = { value: async () => 'original' }
		const server = createJRPCServer(methods)
		methods.value = async () => 'replacement'
		methods.added = async () => 'added'

		expect(await server.handleRequest({ id: 1, jsonrpc: '2.0', method: 'value' })).toEqual({
			id: 1,
			jsonrpc: '2.0',
			result: 'original'
		})
		expect(await server.handleRequest({ id: 2, jsonrpc: '2.0', method: 'added' })).toEqual({
			error: expect.objectContaining({ code: JRPCErrorCodes.METHOD_NOT_FOUND }),
			id: 2,
			jsonrpc: '2.0'
		})
	})
})
