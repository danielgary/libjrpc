import { JRPCErrorCodes } from '../foundation/constants/JRPCErrorCodes'
import { JRPCError } from '../foundation/JRPCError'
import { JRPCMethod } from '../foundation/types/JRPCMethod'
import { JRPCRequest } from '../foundation/types/JRPCRequest'
import { validateRequestId } from '../operations/validation/validateRequestId'

export function validateRequestActivity(
	request: JRPCRequest,
	knownMethods: { [methodName: string]: JRPCMethod }
): boolean {
	if (Array.isArray(request)) {
		return request.every((r) => validateRequestActivity(r, knownMethods))
	}

	if (request.jsonrpc !== '2.0') {
		throw new JRPCError(JRPCErrorCodes.INVALID_REQUEST, `jsonrpc must equal '2.0', got ${request.jsonrpc}`, request)
	}

	if (!validateRequestId(request.id)) {
		throw new JRPCError(
			JRPCErrorCodes.INVALID_REQUEST,
			`Request ID must be a string, integer, or NULL, got ${request.id}`,
			request
		)
	}

	const handler = knownMethods[request.method]
	if (!handler) {
		throw new JRPCError(JRPCErrorCodes.INVALID_REQUEST, `No method found for ${request.method}`, request)
	}

	if (typeof request.params !== 'object') {
		throw new JRPCError(
			JRPCErrorCodes.INVALID_PARAMS,
			`Params must be an object or array, got ${typeof request.params}`,
			request
		)
	}

	return true
}
