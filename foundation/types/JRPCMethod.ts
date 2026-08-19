import { JSONValue } from './JSONValue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JRPCMethod = (params: any, context?: any) => Promise<JSONValue | void>
