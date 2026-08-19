import { JRPCMethodMap, JRPCRequestBody, JRPCResponseBody } from '../foundation/types'
import { JRPCErrorHandler } from '../foundation/types/JRPCServerOptions'
import { executeRequestActivity } from './executeRequestActivity'
import { getRequestId, isNotificationRequest, validateRequestActivity } from './validateRequestActivity'

export async function processRequestActivity<TContext>(
	request: unknown,
	knownMethods: JRPCMethodMap<TContext>,
	context?: TContext,
	onError?: JRPCErrorHandler<TContext>
): Promise<JRPCResponseBody | undefined> {
	const isNotification = isNotificationRequest(request)
	const validationResult = validateRequestActivity(request, knownMethods)
	if (validationResult === null) {
		return executeRequestActivity(request as JRPCRequestBody, knownMethods, context, onError)
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
