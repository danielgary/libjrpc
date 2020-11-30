import { JRPCError } from '../foundation/JRPCError'
import { validateRequestActivity } from './validateRequestActivity'

const knownMethods = {
	success: async function (): Promise<number> {
		return 1
	}
}

describe('validateRequestActivity', () => {
	it('should throw if passed a request with invalid id', () => {
		expect(
			validateRequestActivity({ id: 1.23, method: 'failure', params: [], jsonrpc: '2.0' }, knownMethods)
		).toBeInstanceOf(JRPCError)
	})
	it('should throw if passed a request with invalid params', () => {
		expect(
			validateRequestActivity({ id: 1, method: 'failure', params: 123, jsonrpc: '2.0' }, knownMethods)
		).toBeInstanceOf(JRPCError)
	})
	it('should throw if passed a request with invalid jsonrpc', () => {
		expect(
			validateRequestActivity({ id: 1, method: 'failure', params: 123, jsonrpc: '-2.0' }, knownMethods)
		).toBeInstanceOf(JRPCError)
	})
	it('should throw if passed a request with an invalid method', () => {
		expect(
			validateRequestActivity({ id: 1, method: 'failure', params: [], jsonrpc: '2.0' }, knownMethods)
		).toBeInstanceOf(JRPCError)
	})
	it('should not throw if passed a valid request', () => {
		expect(validateRequestActivity({ id: 1, method: 'success', params: [], jsonrpc: '2.0' }, knownMethods)).toBeNull()
	})
})
