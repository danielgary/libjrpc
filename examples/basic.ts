import { createJRPCServer, JRPCError, JRPCMethod } from '../index'

export type RequestContext = {
	accountId: string
}

type AddParams = {
	left: number
	right: number
}

const add: JRPCMethod<AddParams, number, RequestContext> = (params) => params.left + params.right

const audit: JRPCMethod<{ event: string }, void, RequestContext> = (_params, _context) => {
	// A void result is emitted as JSON null for calls and omitted for notifications.
}

const fail: JRPCMethod<undefined, never, RequestContext> = () => {
	throw new JRPCError(1001, 'The operation was rejected', { retryable: false })
}

export const server = createJRPCServer<RequestContext>(
	{ add, audit, fail },
	{
		onError(error, { context, request }) {
			console.error('Unexpected RPC failure', { accountId: context?.accountId, error, method: request.method })
		}
	}
)

export async function runBatchExample() {
	return server.handleRequest(
		[
			{ id: 1, jsonrpc: '2.0', method: 'add', params: { left: 2, right: 3 } },
			{ jsonrpc: '2.0', method: 'audit', params: { event: 'calculated' } }
		],
		{ accountId: 'account-1' }
	)
}
