import { JRPCMethod } from './JRPCMethod'
import { JRPCRequest } from './JRPCRequest'
import { JRPCResponse } from './JRPCResponse'

export type JRPCServer = {
	handleRequest: (request: JRPCRequest, context?: unknown) => Promise<JRPCResponse | JRPCResponse[]>
	getRequestHandler: (methodName: string) => JRPCMethod | undefined
}
