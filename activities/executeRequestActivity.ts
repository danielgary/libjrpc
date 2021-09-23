import { JRPCErrorCodes } from '../foundation/constants/JRPCErrorCodes'
import { JRPCError } from '../foundation/JRPCError'
import { JRPCMethod } from '../foundation/types/JRPCMethod'
import { JRPCRequest } from '../foundation/types/JRPCRequest'
import { JRPCResponse } from '../foundation/types/JRPCResponse'
import { JRPCResponseBody } from '../foundation/types/JRPCResponseBody'

export async function executeRequestActivity(
	request: JRPCRequest,
	knownMethods: { [methodName: string]: JRPCMethod },
	context?: unknown
): Promise<JRPCResponse> {
	if (Array.isArray(request)) {
		const requestExecutions = request.map((r) => executeRequestActivity(r, knownMethods, context))
		const result = await Promise.all(requestExecutions)
		return result as JRPCResponse
	}

	try {
		const requestHandler = knownMethods[request.method]

		const result = await requestHandler(request.params, context)
		if (request.id) {
			return {
				jsonrpc: '2.0',
				result,
				id: request.id
			} as JRPCResponseBody
		} else {
			return
		}
	} catch (err) {
		if (err instanceof Error) {
			return {
				jsonrpc: '2.0',
				id: request.id,
				error: new JRPCError(JRPCErrorCodes.INTERNAL_ERROR, err.message, err)
			}
		} else {
			return {
				jsonrpc: '2.0',
				id: request.id,
				error: new JRPCError(JRPCErrorCodes.INTERNAL_ERROR)
			}
		}
	}
}
