import { JRPCError, JRPCErrorCodes, JRPCErrorResponse, JRPCResponse } from '../index'
import { RequestContext, server } from './basic'

type ExpressLikeRequest = { body: unknown }
type ExpressLikeResponse = {
	end(): void
	json(body: unknown): void
	status(code: number): ExpressLikeResponse
}

export async function jsonRpcEndpoint(
	req: ExpressLikeRequest,
	res: ExpressLikeResponse,
	context: RequestContext
): Promise<void> {
	const response = await server.handleRequest(req.body, context)

	if (response === undefined) {
		res.status(204).end()
		return
	}

	res.status(200).json(response)
}

export async function handleJsonRpcText(body: string, context: RequestContext): Promise<JRPCResponse> {
	let request: unknown
	try {
		request = JSON.parse(body)
	} catch {
		const parseError: JRPCErrorResponse = {
			error: new JRPCError(JRPCErrorCodes.PARSE_ERROR, 'Parse error'),
			id: null,
			jsonrpc: '2.0'
		}
		return parseError
	}

	return server.handleRequest(request, context)
}
