import { validateRequestId } from './validateRequestId'

describe('validateRequestId', () => {
	it('Should return false if the id is undefined', () => {
		expect(validateRequestId(undefined)).toBeFalsy()
	})
	it('Should return false if the id is a decimal', () => {
		expect(validateRequestId(1.23)).toBeFalsy()
	})
	it('Should return true for an empty string', () => {
		expect(validateRequestId('')).toBeTruthy()
	})
	it('Should return true for valid ids', () => {
		expect(validateRequestId(null)).toBeTruthy()
		expect(validateRequestId(1)).toBeTruthy()
		expect(validateRequestId('test')).toBeTruthy()
	})
})
