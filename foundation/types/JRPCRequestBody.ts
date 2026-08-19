import { JRPCId } from './JRPCId'
import { JRPCParams } from './JRPCParams'

type JRPCRequestBase<TParams extends JRPCParams | undefined = JRPCParams | undefined> = {
	jsonrpc: '2.0'
	method: string
	params?: TParams
}

export type JRPCCall<TParams extends JRPCParams | undefined = JRPCParams | undefined> = JRPCRequestBase<TParams> & {
	id: JRPCId
}

export type JRPCNotification<TParams extends JRPCParams | undefined = JRPCParams | undefined> =
	JRPCRequestBase<TParams> & {
		id?: never
	}

export type JRPCRequestBody<TParams extends JRPCParams | undefined = JRPCParams | undefined> =
	| JRPCCall<TParams>
	| JRPCNotification<TParams>
