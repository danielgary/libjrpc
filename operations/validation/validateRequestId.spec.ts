import { validateRequestId } from './validateRequestId'

describe('validateRequestId', () => {
	it('Should return false if the id is undefined', () => {
		expect(validateRequestId(undefined as any)).toBeFalsy()
	})
	it('Should return false if the id is a decimal', () => {
		expect(validateRequestId(1.23)).toBeFalsy()
	})
	it('Should return false for an empty string', () => {
		expect(validateRequestId('')).toBeFalsy()
	})
	it('Should return true for valid ids', () => {
		expect(validateRequestId(null)).toBeTruthy()
		expect(validateRequestId(1)).toBeTruthy()
		expect(validateRequestId('test')).toBeTruthy()
	})
})
