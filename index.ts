import { JRPCMethod } from './foundation/types/JRPCMethod'
import { JRPCRequest } from './foundation/types/JRPCRequest'
import { JRPCServer } from './foundation/types/JRPCServer'

import { JRPCResponse } from './foundation/types/JRPCResponse'
import { processRequestActivity } from './activities/processRequestActivity'

export * from './foundation/types'
export { JRPCErrorCodes } from './foundation/constants/JRPCErrorCodes'
export { JRPCError } from './foundation/JRPCError'

export function createJRPCServer(methods: { [key: string]: JRPCMethod }): JRPCServer {
	methods['rpc_discover'] = async (): Promise<string[]> => {
		return Object.keys(methods)
	}

	return {
		getRequestHandler: (methodName: string): JRPCMethod | undefined => {
			return methods[methodName] || undefined
		},
		handleRequest: async (request: JRPCRequest, context?: unknown): Promise<JRPCResponse | JRPCResponse[]> => {
			if (Array.isArray(request)) {
				return Promise.all(request.map(async (r) => processRequestActivity(r, methods, context)))
			} else {
				return processRequestActivity(request, methods, context)
			}
		}
	}
}
