import { JSONValue } from './JSONValue'
import { JRPCParams } from './JRPCParams'

export type MaybePromise<T> = PromiseLike<T> | T

export type JRPCMethod<
	TParams extends JRPCParams | undefined = JRPCParams | undefined,
	TResult extends JSONValue | void = JSONValue | void,
	TContext = unknown
> = {
	bivarianceHack(params: TParams, context?: TContext): MaybePromise<TResult>
}['bivarianceHack']

export type JRPCMethodMap<TContext = unknown> = {
	[methodName: string]: JRPCMethod<JRPCParams | undefined, JSONValue | void, TContext>
}
