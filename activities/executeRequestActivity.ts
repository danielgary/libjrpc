import { JRPCErrorCodes } from '../foundation/constants/JRPCErrorCodes'
import { JRPCError } from '../foundation/JRPCError'
import { JRPCMethod } from '../foundation/types/JRPCMethod'
import { JRPCRequestBody } from '../foundation/types/JRPCRequestBody'
import { JRPCResponse } from '../foundation/types/JRPCResponse'
import { JRPCResponseBody } from '../foundation/types/JRPCResponseBody'
import { JRPCErrorHandler } from '../foundation/types/JRPCServerOptions'

async function reportError(
	onError: JRPCErrorHandler | undefined,
	error: unknown,
	request: JRPCRequestBody,
	context?: unknown
): Promise<void> {
	if (!onError) {
		return
	}

	try {
		await onError(error, { context, request })
	} catch {
		// Observability failures must not change the JSON-RPC response.
	}
}

export async function executeRequestActivity(
	request: JRPCRequestBody,
	knownMethods: { [methodName: string]: JRPCMethod },
	context?: unknown,
	onError?: JRPCErrorHandler
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
		await reportError(onError, err, request, context)

		if (!Object.prototype.hasOwnProperty.call(request, 'id')) {
			return
		}

		if (err instanceof JRPCError) {
			return {
				jsonrpc: '2.0',
				id: request.id,
				error: err
			}
		}

		return {
			jsonrpc: '2.0',
			id: request.id,
			error: new JRPCError(JRPCErrorCodes.INTERNAL_ERROR, 'Internal error')
		}
	}
}
