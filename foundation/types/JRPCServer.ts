import { JRPCMethodMap } from './JRPCMethod'
import { JRPCCall, JRPCNotification, JRPCRequestBody } from './JRPCRequestBody'
import { JRPCResponse } from './JRPCResponse'
import { JRPCErrorResponse, JRPCResponseBody } from './JRPCResponseBody'

export type JRPCRequestHandler<TContext = unknown> = {
	(request: JRPCCall, context?: TContext): Promise<JRPCResponseBody>
	(request: JRPCNotification, context?: TContext): Promise<undefined>
	(request: readonly [], context?: TContext): Promise<JRPCErrorResponse>
	(
		request: readonly [JRPCRequestBody, ...JRPCRequestBody[]],
		context?: TContext
	): Promise<JRPCResponseBody[] | undefined>
	(request: unknown, context?: TContext): Promise<JRPCResponse>
}

export type JRPCServer<TContext = unknown> = {
	handleRequest: JRPCRequestHandler<TContext>
	getRequestHandler: (methodName: string) => JRPCMethodMap<TContext>[string] | undefined
}
