export function validateRequestId(id: unknown): id is string | number | null {
	if (typeof id === 'string') {
		return true
	}
	if (typeof id === 'number') {
		return Number.isInteger(id)
	}
	return id === null
}
