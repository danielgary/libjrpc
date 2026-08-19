import { JRPCRequestBody } from './JRPCRequestBody'

export type JRPCErrorHandlerDetails<TContext = unknown> = {
	context?: TContext
	request: JRPCRequestBody
}

export type JRPCErrorHandler<TContext = unknown> = (
	error: unknown,
	details: JRPCErrorHandlerDetails<TContext>
) => Promise<void> | void

export type JRPCServerOptions<TContext = unknown> = {
	onError?: JRPCErrorHandler<TContext>
}
