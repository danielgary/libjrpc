import { JSONValue } from './JSONValue'

export type JRPCNamedParams = { [key: string]: JSONValue }
export type JRPCPositionalParams = JSONValue[]
export type JRPCParams = JRPCNamedParams | JRPCPositionalParams
