import { JRPCErrorCodes } from '../foundation/constants/JRPCErrorCodes'
import { JRPCError } from '../foundation/JRPCError'
import { JRPCMethod } from '../foundation/types/JRPCMethod'
import { JRPCRequestBody } from '../foundation/types/JRPCRequestBody'
import { JRPCResponse } from '../foundation/types/JRPCResponse'
import { JRPCResponseBody } from '../foundation/types/JRPCResponseBody'

export async function executeRequestActivity(
	request: JRPCRequestBody,
	knownMethods: { [methodName: string]: JRPCMethod },
	context?: unknown
): Promise<JRPCResponse> {
	try {
		const requestHandler = knownMethods[request.method]

		const result = await requestHandler(request.params, context)
		if (Object.prototype.hasOwnProperty.call(request, 'id')) {
			return {
				jsonrpc: '2.0',
				result,
				id: request.id
			} as JRPCResponseBody
		} else {
			return
		}
	} catch (err) {
		if (!Object.prototype.hasOwnProperty.call(request, 'id')) {
			return
		}

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
