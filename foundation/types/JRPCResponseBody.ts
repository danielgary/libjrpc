import { JRPCError } from '../JRPCError'

export type JRPCResponseBody = {
	jsonrpc: string
	id?: string | number | null
	result?: unknown
	error?: JRPCError
}
