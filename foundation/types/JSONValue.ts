export type JSONPrimitive = boolean | null | number | string

export type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue }
