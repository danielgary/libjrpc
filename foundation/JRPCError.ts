import { JRPCErrorCodes } from './constants/JRPCErrorCodes'

export class JRPCError extends Error {
	public code: JRPCErrorCodes | number
	public data?: unknown | undefined

	constructor(code: JRPCErrorCodes | number, message?: string, data?: unknown) {
		super(message) // 'Error' breaks prototype chain here
		this.code = code
		this.data = data
		Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
	}
}
