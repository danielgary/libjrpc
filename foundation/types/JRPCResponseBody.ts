import { JRPCError } from '../JRPCError'
import { JRPCId } from './JRPCId'
import { JSONValue } from './JSONValue'

export type JRPCSuccessResponse<TResult extends JSONValue = JSONValue> = {
	error?: never
	id: JRPCId
	jsonrpc: '2.0'
	result: TResult
}

export type JRPCErrorResponse = {
	error: JRPCError
	id: JRPCId
	jsonrpc: '2.0'
	result?: never
}

export type JRPCResponseBody<TResult extends JSONValue = JSONValue> = JRPCErrorResponse | JRPCSuccessResponse<TResult>
