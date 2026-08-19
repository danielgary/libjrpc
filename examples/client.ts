import { JRPCParams, JSONValue } from '../index'

type ClientError = {
	code: number
	data?: JSONValue
	message: string
}

type ClientResponse<TResult extends JSONValue> =
	| { error: ClientError; id: number; jsonrpc: '2.0' }
	| { id: number; jsonrpc: '2.0'; result: TResult }

export class RemoteJRPCError extends Error {
	constructor(public readonly code: number, message: string, public readonly data?: JSONValue) {
		super(message)
		this.name = 'RemoteJRPCError'
		Object.setPrototypeOf(this, new.target.prototype)
	}
}

let nextId = 1

export async function call<TResult extends JSONValue>(
	url: string,
	method: string,
	params?: JRPCParams
): Promise<TResult> {
	const id = nextId++
	const response = await fetch(url, {
		body: JSON.stringify({ id, jsonrpc: '2.0', method, params }),
		headers: { 'content-type': 'application/json' },
		method: 'POST'
	})
	const body = (await response.json()) as ClientResponse<TResult>

	if ('error' in body) {
		throw new RemoteJRPCError(body.error.code, body.error.message, body.error.data)
	}

	return body.result
}
