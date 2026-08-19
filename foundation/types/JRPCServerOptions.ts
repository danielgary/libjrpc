import { JRPCRequestBody } from './JRPCRequestBody'

export type JRPCErrorHandlerDetails = {
	context?: unknown
	request: JRPCRequestBody
}

export type JRPCErrorHandler = (error: unknown, details: JRPCErrorHandlerDetails) => Promise<void> | void

export type JRPCServerOptions = {
	onError?: JRPCErrorHandler
}
