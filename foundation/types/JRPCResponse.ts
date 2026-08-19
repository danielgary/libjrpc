import { JRPCResponseBody } from './JRPCResponseBody'
import { JSONValue } from './JSONValue'

export type JRPCResponse<TResult extends JSONValue = JSONValue> =
	JRPCResponseBody<TResult> | JRPCResponseBody<TResult>[] | undefined
