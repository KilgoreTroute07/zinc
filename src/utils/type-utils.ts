import { z } from 'zod';

export type ArrayMemberType<T> = T extends Array<infer U> ? U : never;
export type NoUndefined<T> = T extends undefined ? never : T;
export type ObjectValues<T> = T[keyof T];
export type MaybePromise<T> = T | Promise<T>;

export type NonEmptyArray<T> = [T, ...T[]];
export function isNonEmptyArray<T>(array: T[]): array is NonEmptyArray<T> {
  return array.length > 0;
}

export type NonUndefinedOutput<TSchema extends z.ZodTypeAny> =
  undefined extends z.output<TSchema> ? never : TSchema;

/** Infers Optional literal from args (true when optional: true, else false). */
export type InferOptional<A extends { optional?: boolean }> = A extends {
  optional: true;
}
  ? true
  : false;
