import { JRPCErrorCodes } from './constants/JRPCErrorCodes'
import { isJSONValue, JSONValue } from './types/JSONValue'

export class JRPCError extends Error {
	public code: JRPCErrorCodes | number
	public data?: JSONValue | undefined

	constructor(code: JRPCErrorCodes | number, message?: string, data?: JSONValue) {
		super(message) // 'Error' breaks prototype chain here
		if (!Number.isInteger(code)) {
			throw new TypeError('JRPC error code must be an integer')
		}
		if (data !== undefined && !isJSONValue(data)) {
			throw new TypeError('JRPC error data must be JSON-compatible')
		}

		this.name = 'JRPCError'
		this.code = code
		this.data = data
		Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
	}

	public toJSON(): Record<string, unknown> {
		return {
			code: this.code,
			message: this.message,
			data: this.data
		}
	}
}
