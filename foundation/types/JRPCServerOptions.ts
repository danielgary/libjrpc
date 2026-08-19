import { JRPCRequestBody } from './JRPCRequestBody'
import { JSONValue } from './JSONValue'

export type JRPCErrorHandlerDetails<TContext = unknown> = {
	context?: TContext
	request: JRPCRequestBody
}

export type JRPCErrorHandler<TContext = unknown> = (
	error: unknown,
	details: JRPCErrorHandlerDetails<TContext>
) => Promise<void> | void

export type JRPCResultSerializer = (value: unknown) => JSONValue

export type JRPCServerOptions<TContext = unknown> = {
	enableDiscovery?: boolean
	onError?: JRPCErrorHandler<TContext>
	serializeResult?: JRPCResultSerializer
}
