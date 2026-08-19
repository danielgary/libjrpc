import { JRPCMethod } from './foundation/types/JRPCMethod'
import { JRPCServer } from './foundation/types/JRPCServer'
import { JRPCServerOptions } from './foundation/types/JRPCServerOptions'

import { JRPCResponse } from './foundation/types/JRPCResponse'
import { JRPCResponseBody } from './foundation/types/JRPCResponseBody'
import { processRequestActivity } from './activities/processRequestActivity'
import { JRPCErrorCodes } from './foundation/constants/JRPCErrorCodes'
import { JRPCError } from './foundation/JRPCError'

export * from './foundation/types'
export { JRPCErrorCodes } from './foundation/constants/JRPCErrorCodes'
export { JRPCError } from './foundation/JRPCError'

export function createJRPCServer(methods: { [key: string]: JRPCMethod }, options: JRPCServerOptions = {}): JRPCServer {
	methods['rpc_discover'] = async (): Promise<string[]> => {
		return Object.keys(methods)
	}

	return {
		getRequestHandler: (methodName: string): JRPCMethod | undefined => {
			return Object.prototype.hasOwnProperty.call(methods, methodName) ? methods[methodName] : undefined
		},
		handleRequest: async (request: unknown, context?: unknown): Promise<JRPCResponse | JRPCResponse[]> => {
			if (Array.isArray(request)) {
				if (request.length === 0) {
					return {
						jsonrpc: '2.0',
						id: null,
						error: new JRPCError(JRPCErrorCodes.INVALID_REQUEST, 'Invalid Request')
					}
				}

				const responses = await Promise.all(
					request.map(async (r) => processRequestActivity(r, methods, context, options.onError))
				)
				const responseBodies = responses.filter((response): response is JRPCResponseBody => response !== undefined)
				return responseBodies.length > 0 ? responseBodies : undefined
			} else {
				return processRequestActivity(request, methods, context, options.onError)
			}
		}
	}
}
