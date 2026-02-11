export function isObject(
  value: unknown
): value is Record<PropertyKey, unknown> {
  return !!value && Object.prototype.toString.call(value) === '[object Object]';
}
