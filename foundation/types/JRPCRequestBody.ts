export type JRPCRequestBody = {
	id: string | number | null
	jsonrpc: string
	method: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	params: any
}
