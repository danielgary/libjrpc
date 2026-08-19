import { JRPCMethod, JRPCRequestBody, JRPCResponse } from '../foundation/types'
import { executeRequestActivity } from './executeRequestActivity'
import { getRequestId, isNotificationRequest, validateRequestActivity } from './validateRequestActivity'

export async function processRequestActivity(
	request: unknown,
	knownMethods: { [methodName: string]: JRPCMethod },
	context?: unknown
): Promise<JRPCResponse> {
	const isNotification = isNotificationRequest(request)
	const validationResult = validateRequestActivity(request, knownMethods)
	if (validationResult === null) {
		return executeRequestActivity(request as JRPCRequestBody, knownMethods, context)
	} else if (isNotification) {
		return
	} else {
		return {
			jsonrpc: '2.0',
			error: validationResult,
			id: getRequestId(request)
		}
	}
}
