import { JSONValue } from './JSONValue'
import { JRPCParams } from './JRPCParams'

export type MaybePromise<T> = PromiseLike<T> | T

export type JRPCMethod<
	TParams extends object | undefined = JRPCParams | undefined,
	TResult = JSONValue | void,
	TContext = unknown
> = {
	bivarianceHack(params: TParams, context?: TContext): MaybePromise<TResult>
}['bivarianceHack']

export type JRPCMethodMap<TContext = unknown> = {
	[methodName: string]: {
		bivarianceHack(params: object | undefined, context?: TContext): MaybePromise<unknown>
	}['bivarianceHack']
}
