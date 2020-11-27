import { JRPCErrorCodes } from './constants/JRPCErrorCodes'
import { JRPCError } from './JRPCError'

describe('JRPCError', () => {
	describe('toJSON', () => {
		it('should include code, message and data in JSON.stringify result', () => {
			const code = JRPCErrorCodes.INTERNAL_ERROR
			const message = 'Something bad happened'
			const data = { test: 'abc', xyz: 123 }

			const error = new JRPCError(code, message, data)

			const expectedResult = JSON.stringify({
				code,
				message,
				data
			})

			expect(JSON.stringify(error)).toEqual(expectedResult)
		})
	})
})
