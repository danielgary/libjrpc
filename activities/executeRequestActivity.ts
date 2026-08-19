import { JRPCErrorCodes } from '../foundation/constants/JRPCErrorCodes'
import { JRPCError } from '../foundation/JRPCError'
import { JRPCId } from '../foundation/types/JRPCId'
import { JRPCMethodMap } from '../foundation/types/JRPCMethod'
import { JRPCRequestBody } from '../foundation/types/JRPCRequestBody'
import { JRPCResponseBody } from '../foundation/types/JRPCResponseBody'
import { JRPCErrorHandler } from '../foundation/types/JRPCServerOptions'
import { isJSONValue } from '../foundation/types/JSONValue'

async function reportError<TContext>(
	onError: JRPCErrorHandler<TContext> | undefined,
	error: unknown,
	request: JRPCRequestBody,
	context?: TContext
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

export async function executeRequestActivity<TContext>(
	request: JRPCRequestBody,
	knownMethods: JRPCMethodMap<TContext>,
	context?: TContext,
	onError?: JRPCErrorHandler<TContext>
): Promise<JRPCResponseBody | undefined> {
	try {
		const requestHandler = knownMethods[request.method]

		const handlerResult = await requestHandler(request.params, context)
		const result = handlerResult === undefined ? null : handlerResult
		if (!isJSONValue(result)) {
			throw new TypeError('JRPC method result must be JSON-compatible')
		}
		if (Object.prototype.hasOwnProperty.call(request, 'id')) {
			return {
				jsonrpc: '2.0',
				result,
				id: request.id as JRPCId
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
				id: request.id as JRPCId,
				error: err
			}
		}

		return {
			jsonrpc: '2.0',
			id: request.id as JRPCId,
			error: new JRPCError(JRPCErrorCodes.INTERNAL_ERROR, 'Internal error')
		}
	}
}
