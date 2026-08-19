import { JRPCError } from '../JRPCError'
import { JSONValue } from './JSONValue'

export type JRPCResponseBody = {
	jsonrpc: string
	id?: string | number | null
	result?: JSONValue
	error?: JRPCError
}
