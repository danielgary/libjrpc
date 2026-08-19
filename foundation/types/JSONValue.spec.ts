import { isJSONValue, jsonSerializer } from './JSONValue'
import { describe, expect, it } from 'vitest'

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

describe('jsonSerializer', () => {
	it('normalizes nested dates and custom toJSON values', () => {
		const value = {
			createdAt: new Date('2026-08-19T12:00:00.000Z'),
			custom: { toJSON: () => ({ serialized: true }) }
		}

		expect(jsonSerializer(value)).toEqual({
			createdAt: '2026-08-19T12:00:00.000Z',
			custom: { serialized: true }
		})
	})

	it('uses standard JSON normalization semantics', () => {
		expect(jsonSerializer({ array: [undefined, NaN, Infinity], omitted: undefined })).toEqual({
			array: [null, null, null]
		})
	})

	it.each([undefined, BigInt(1), Symbol('value'), () => undefined])(
		'rejects an unserializable top-level value %p',
		(value) => {
			expect(() => jsonSerializer(value)).toThrow()
		}
	)

	it('rejects cyclic values', () => {
		const value: { self?: unknown } = {}
		value.self = value

		expect(() => jsonSerializer(value)).toThrow()
	})
})
