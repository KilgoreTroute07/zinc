import { z } from 'zod';
import type {
  EnvSchemaMap,
  EnvironmentSchema,
  ZincOptionArray,
  ZincOptionInternalDef,
} from './types';

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

type NonStandardizedDefinition<
  TName extends string,
  TSchema extends z.ZodType,
> = Omit<
  ZincOptionInternalDef<TName, TSchema>,
  'default' | 'optional' | 'silent'
> &
  Partial<
    Pick<
      ZincOptionInternalDef<TName, TSchema>,
      'default' | 'optional' | 'silent'
    >
  >;
export function setDefaults<
  const TName extends string,
  const TSchema extends z.ZodType,
  const TLooseDefinition extends NonStandardizedDefinition<TName, TSchema>,
>(looseDefinition: TLooseDefinition): ZincOptionInternalDef<TName, TSchema> {
  return {
    name: looseDefinition.name,
    flags: looseDefinition.flags,
    description: looseDefinition.description,
    schema: looseDefinition.schema,
    inquire: looseDefinition.inquire,
    default: looseDefinition.default ?? null,
    optional: looseDefinition.optional ?? false,
    silent: looseDefinition.silent ?? false,
  } as const satisfies ZincOptionInternalDef<TName, TSchema>;
}
