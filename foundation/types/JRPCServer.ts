import { JRPCMethod } from './JRPCMethod'
import { JRPCResponse } from './JRPCResponse'

export type JRPCServer = {
	handleRequest: (request: unknown, context?: unknown) => Promise<JRPCResponse | JRPCResponse[]>
	getRequestHandler: (methodName: string) => JRPCMethod | undefined
}
