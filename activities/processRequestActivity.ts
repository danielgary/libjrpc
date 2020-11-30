import { JRPCMethod, JRPCRequestBody, JRPCResponse } from '../foundation/types'
import { executeRequestActivity } from './executeRequestActivity'
import { validateRequestActivity } from './validateRequestActivity'

export async function processRequestActivity(
	request: JRPCRequestBody,
	knownMethods: { [methodName: string]: JRPCMethod },
	context?: unknown
): Promise<JRPCResponse> {
	const validationResult = validateRequestActivity(request, knownMethods)
	if (validationResult === null) {
		return executeRequestActivity(request, knownMethods, context)
	} else {
		return {
			jsonrpc: '2.0',
			error: validationResult,
			id: request.id
		}
	}
}
