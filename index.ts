import { executeRequestActivity } from './activities/executeRequestActivity'
import { validateRequestActivity } from './activities/validateRequestActivity'
import { JRPCMethod } from './foundation/types/JRPCMethod'
import { JRPCRequest } from './foundation/types/JRPCRequest'
import { JRPCServer } from './foundation/types/JRPCServer'
import { JRPCError } from './foundation/JRPCError'
import { JRPCErrorCodes } from './foundation/constants/JRPCErrorCodes'
import { JRPCResponse } from './foundation/types/JRPCResponse'

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
		handleRequest: async (request: JRPCRequest, context?: unknown): Promise<JRPCResponse> => {
			try {
				await validateRequestActivity(request, methods)

				return executeRequestActivity(request, methods, context)
			} catch (err) {
				return {
					jsonrpc: '2.0',
					error: new JRPCError(JRPCErrorCodes.INTERNAL_ERROR, err.message, err)
				}
			}
		}
	}
}
