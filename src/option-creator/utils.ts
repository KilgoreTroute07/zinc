import { z } from 'zod';
import type { EnvSchemaMap, EnvironmentSchema, ZincOptionArray } from './types';

export function buildEnvironmentSchemaFromOptions<
  const Options extends ZincOptionArray,
>(options: Options): EnvironmentSchema<Options> {
  const optionSchemaMap = options.reduce((acc, option) => {
    return {
      ...acc,
      ...option.getRegistrationObject(),
    };
  }, {} as EnvSchemaMap<Options>);

  return z.object(optionSchemaMap);
}
