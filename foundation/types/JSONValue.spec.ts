import { isJSONValue } from './JSONValue'

describe('isJSONValue', () => {
	it.each([
		null,
		true,
		false,
		0,
		1.5,
		'',
		'text',
		[],
		[1, 'two', null],
		{},
		{ nested: { values: [1, true, null] } },
		Object.assign(Object.create(null), { value: 1 })
	])('accepts JSON-compatible value %p', (value) => {
		expect(isJSONValue(value)).toBe(true)
	})

	it.each([undefined, NaN, Infinity, -Infinity, BigInt(1), Symbol('value'), () => undefined, new Date()])(
		'rejects non-JSON value %p',
		(value) => {
			expect(isJSONValue(value)).toBe(false)
		}
	)

	it('rejects cyclic values', () => {
		const value: { self?: unknown } = {}
		value.self = value

		expect(isJSONValue(value)).toBe(false)
	})
})
