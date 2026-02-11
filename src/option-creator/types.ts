import { z } from 'zod';
import { NoUndefined } from '../utils/type-utils';
import type { CliOptionBrand, ZincOption } from './zinc-option';

export interface CreateCommandOptionArgs<Name extends string> {
  name: Name;
  flags: string;
  description: string;
}

/** Allowed when default is set: optional must be false; silent allowed. */
export type OptionParamsWithDefault<Schema extends z.ZodType> = {
  default: NoUndefined<z.output<Schema>>;
  optional?: false;
  /** When true, skip inquirer when default applies. Only allowed when default is set or optional is true. */
  silent?: boolean;
};

/** Allowed when optional is true: default must be unset; silent allowed. */
export type OptionParamsWithOptional = {
  optional: true;
  default?: undefined;
  silent?: boolean;
};

/** No default, not optional: silent not allowed. */
export type OptionParamsRequired = {
  default?: undefined;
  optional?: false;
  silent?: never;
};

export type OptionParams<Schema extends z.ZodType> =
  | OptionParamsWithDefault<Schema>
  | OptionParamsWithOptional
  | OptionParamsRequired;

export interface CommonOptionCreatorArgs<
  Name extends string,
  Schema extends z.ZodType,
> extends CreateCommandOptionArgs<Name> {
  inquiry?: string;
  schema: Schema;
  /** When true, .optional() is applied to the schema so undefined parses successfully. Mutually exclusive with default. */
  optional?: boolean;
  default?: NoUndefined<z.output<Schema>>;
  /** When true, skip inquirer when default applies. Only allowed when default is set or optional is true. */
  silent?: boolean;
}

type CommonOptionCreatorArgsBase<
  Name extends string,
  Schema extends z.ZodType,
> = CreateCommandOptionArgs<Name> & { inquiry?: string; schema: Schema };

/** Exclude args that have both default and optional: true (mutually exclusive). */
type NoDefaultWithOptionalTrue = { default?: undefined } | { optional?: false };

/** CommonOptionCreatorArgs with optional/default/silent mutually constrained. */
export type CommonOptionCreatorArgsConstrained<
  Name extends string,
  Schema extends z.ZodType,
> = (
  | (CommonOptionCreatorArgsBase<Name, Schema> &
      OptionParamsWithDefault<Schema>)
  | (CommonOptionCreatorArgsBase<Name, Schema> & OptionParamsWithOptional)
  | (CommonOptionCreatorArgsBase<Name, Schema> & OptionParamsRequired)
) &
  NoDefaultWithOptionalTrue;

export type ZincOptionArray = readonly ZincOption<string, z.ZodType, boolean>[];

export type EnvSchemaMap<Options extends ZincOptionArray> = {
  [K in keyof Options as Options[K] extends ZincOption<
    infer OptionName,
    z.ZodType,
    boolean
  >
    ? OptionName
    : never]: Options[K] extends ZincOption<string, z.ZodType, boolean>
    ? Options[K]['schema']
    : never;
};

export type EnvironmentSchema<Options extends ZincOptionArray> = z.ZodObject<
  Readonly<EnvSchemaMap<Options>>,
  z.core.$strip
>;

/** Inferred type for parsed options, based on the Zod environment schema. */
export type ParsedOptions<Options extends ZincOptionArray> = z.infer<
  EnvironmentSchema<Options>
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CliInfer<Option extends ZincOption<any, any, any>> =
  Option[CliOptionBrand]['output'];

export type OptionType = 'boolean' | 'input' | 'select';
