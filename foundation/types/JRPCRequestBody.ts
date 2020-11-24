import { JRPCRequestParams } from './JRPCRequestParams'

export type JRPCRequestBody = {
	id: string | number | null
	jsonrpc: string
	method: string
	params: JRPCRequestParams
}
