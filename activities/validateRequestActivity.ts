import { JRPCErrorCodes } from '../foundation/constants/JRPCErrorCodes'
import { JRPCError } from '../foundation/JRPCError'
import { JRPCMethod } from '../foundation/types/JRPCMethod'

import { validateRequestId } from '../operations/validation/validateRequestId'

type RequestObject = Record<string, unknown>

function isRequestObject(request: unknown): request is RequestObject {
	return typeof request === 'object' && request !== null && !Array.isArray(request)
}

function hasOwnMember(request: RequestObject, member: string): boolean {
	return Object.prototype.hasOwnProperty.call(request, member)
}

export function getRequestId(request: unknown): string | number | null {
	if (!isRequestObject(request) || !hasOwnMember(request, 'id')) {
		return null
	}

	return validateRequestId(request.id) ? request.id : null
}

export function isNotificationRequest(request: unknown): boolean {
	return (
		isRequestObject(request) &&
		request.jsonrpc === '2.0' &&
		typeof request.method === 'string' &&
		!hasOwnMember(request, 'id')
	)
}

export function validateRequestActivity(
	request: unknown,
	knownMethods: { [methodName: string]: JRPCMethod }
): JRPCError | null {
	if (!isRequestObject(request)) {
		return new JRPCError(JRPCErrorCodes.INVALID_REQUEST, 'Request must be an object', request)
	}

	if (request.jsonrpc !== '2.0') {
		return new JRPCError(JRPCErrorCodes.INVALID_REQUEST, `jsonrpc must equal '2.0', got ${request.jsonrpc}`, request)
	}

	if (typeof request.method !== 'string') {
		return new JRPCError(JRPCErrorCodes.INVALID_REQUEST, 'Method must be a string', request)
	}

	if (hasOwnMember(request, 'id') && !validateRequestId(request.id)) {
		return new JRPCError(
			JRPCErrorCodes.INVALID_REQUEST,
			`Request ID must be a string, integer, or NULL, got ${request.id}`,
			request
		)
	}

	const hasHandler = Object.prototype.hasOwnProperty.call(knownMethods, request.method)
	const handler = hasHandler ? knownMethods[request.method] : undefined
	if (typeof handler !== 'function') {
		return new JRPCError(JRPCErrorCodes.METHOD_NOT_FOUND, `No method found for ${request.method}`, request)
	}

	if (hasOwnMember(request, 'params') && !isRequestObject(request.params) && !Array.isArray(request.params)) {
		return new JRPCError(
			JRPCErrorCodes.INVALID_PARAMS,
			`Params must be an object or array, got ${typeof request.params}`,
			request
		)
	}

	return null
}
