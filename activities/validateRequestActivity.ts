import { JRPCErrorCodes } from '../foundation/constants/JRPCErrorCodes'
import { JRPCError } from '../foundation/JRPCError'
import { JRPCRequestBody } from '../foundation/types'
import { JRPCMethod } from '../foundation/types/JRPCMethod'

import { validateRequestId } from '../operations/validation/validateRequestId'

export function validateRequestActivity(
	request: JRPCRequestBody,
	knownMethods: { [methodName: string]: JRPCMethod }
): JRPCError | null {
	if (request.jsonrpc !== '2.0') {
		return new JRPCError(JRPCErrorCodes.INVALID_REQUEST, `jsonrpc must equal '2.0', got ${request.jsonrpc}`, request)
	}

	if (!validateRequestId(request.id)) {
		return new JRPCError(
			JRPCErrorCodes.INVALID_REQUEST,
			`Request ID must be a string, integer, or NULL, got ${request.id}`,
			request
		)
	}

	const handler = knownMethods[request.method]
	if (!handler) {
		return new JRPCError(JRPCErrorCodes.INVALID_REQUEST, `No method found for ${request.method}`, request)
	}

	if (typeof request.params !== 'object') {
		return new JRPCError(
			JRPCErrorCodes.INVALID_PARAMS,
			`Params must be an object or array, got ${typeof request.params}`,
			request
		)
	}

	return null
}
