import { JRPCMethodMap } from './foundation/types/JRPCMethod'
import { JRPCRequestHandler, JRPCServer } from './foundation/types/JRPCServer'
import { JRPCServerOptions } from './foundation/types/JRPCServerOptions'

import { JRPCResponse } from './foundation/types/JRPCResponse'
import { JRPCResponseBody } from './foundation/types/JRPCResponseBody'
import { processRequestActivity } from './activities/processRequestActivity'
import { JRPCErrorCodes } from './foundation/constants/JRPCErrorCodes'
import { JRPCError } from './foundation/JRPCError'

export * from './foundation/types'
export { JRPCErrorCodes } from './foundation/constants/JRPCErrorCodes'
export { JRPCError } from './foundation/JRPCError'

export function createJRPCServer<TContext = unknown>(
	methods: JRPCMethodMap<TContext>,
	options: JRPCServerOptions<TContext> = {}
): JRPCServer<TContext> {
	const knownMethods = Object.keys(methods).reduce<JRPCMethodMap<TContext>>(
		(registry, methodName) => {
			registry[methodName] = methods[methodName]
			return registry
		},
		Object.create(null) as JRPCMethodMap<TContext>
	)

	if (options.enableDiscovery) {
		if (Object.prototype.hasOwnProperty.call(knownMethods, 'rpc_discover')) {
			throw new Error('Cannot enable discovery when rpc_discover is already registered')
		}

		knownMethods.rpc_discover = (): string[] => Object.keys(knownMethods)
	}

	const handleRequest = async (request: unknown, context?: TContext): Promise<JRPCResponse> => {
		if (Array.isArray(request)) {
			if (request.length === 0) {
				return {
					jsonrpc: '2.0',
					id: null,
					error: new JRPCError(JRPCErrorCodes.INVALID_REQUEST, 'Invalid Request')
				}
			}

			const responses = await Promise.all(
				request.map(async (r) => processRequestActivity(r, knownMethods, context, options))
			)
			const responseBodies = responses.filter((response): response is JRPCResponseBody => response !== undefined)
			return responseBodies.length > 0 ? responseBodies : undefined
		}

		return processRequestActivity(request, knownMethods, context, options)
	}

	return {
		getRequestHandler: (methodName: string): JRPCMethodMap<TContext>[string] | undefined => {
			return Object.prototype.hasOwnProperty.call(knownMethods, methodName) ? knownMethods[methodName] : undefined
		},
		handleRequest: handleRequest as JRPCRequestHandler<TContext>
	}
}
