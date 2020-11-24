export function validateRequestId(id: string | number | null): boolean {
	if (typeof id === 'string' && id !== '') {
		return true
	}
	if (typeof id === 'number') {
		return Number.isInteger(id)
	}
	return id === null
}
