import { JRPCRequestBody } from './JRPCRequestBody'
import { JRPCParams } from './JRPCParams'

export type JRPCRequest<TParams extends JRPCParams | undefined = JRPCParams | undefined> =
	JRPCRequestBody<TParams> | JRPCRequestBody<TParams>[]
