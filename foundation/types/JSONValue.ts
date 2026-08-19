export type JSONPrimitive = boolean | null | number | string

export type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue }

function isJSONValueInternal(value: unknown, ancestors: object[]): value is JSONValue {
	if (value === null || typeof value === 'boolean' || typeof value === 'string') {
		return true
	}

	if (typeof value === 'number') {
		return Number.isFinite(value)
	}

	if (typeof value !== 'object' || ancestors.indexOf(value) !== -1) {
		return false
	}

	const prototype = Object.getPrototypeOf(value)
	if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
		return false
	}

	ancestors.push(value)
	const objectValue = value as Record<string, unknown>
	const childValues = Array.isArray(value) ? value : Object.keys(objectValue).map((key) => objectValue[key])
	const isValid = childValues.every((child) => isJSONValueInternal(child, ancestors))
	ancestors.pop()

	return isValid
}

export function isJSONValue(value: unknown): value is JSONValue {
	return isJSONValueInternal(value, [])
}

export function jsonSerializer(value: unknown): JSONValue {
	const serialized = JSON.stringify(value)
	if (serialized === undefined) {
		throw new TypeError('JRPC value must be JSON-serializable')
	}

	const result: unknown = JSON.parse(serialized)
	if (!isJSONValue(result)) {
		throw new TypeError('JRPC serializer produced a non-JSON value')
	}

	return result
}
