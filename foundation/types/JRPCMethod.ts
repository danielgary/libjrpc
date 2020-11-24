import { JRPCRequestParams } from './JRPCRequestParams'

export type JRPCMethod = (params: JRPCRequestParams, context?: unknown) => Promise<unknown>
