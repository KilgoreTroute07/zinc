import { Option } from 'commander';
import { z } from 'zod';
import { NoUndefined } from '../utils/type-utils';

export const $InternalsBrand: unique symbol = Symbol('cli_option');
export type InternalsBrandType = typeof $InternalsBrand;

/** Allowed when default is set: optional must be false; silent allowed. */
export type OptionParamsWithDefault<Schema extends z.ZodType> = {
  default: NoUndefined<z.output<Schema>>;
  optional?: false;
  /** When true, skip inquirer when default applies. Only allowed when default is set or optional is true. */
  silent?: boolean;
};

/** No default, required: silent not allowed. Use .optional() to make optional. */
export type OptionParamsRequired = {
  default?: undefined;
  optional?: false;
  silent?: never;
};

interface CommonOptionCreatorArgs<
  Name extends string,
  Schema extends z.ZodType,
> {
  name: Name;
  flags: string;
  description: string;
  inquiry?: string;
  schema: Schema;
  default?: NoUndefined<z.output<Schema>>;
  /** When true, skip inquirer when default applies. Only allowed when default is set. Use .optional().silent() for optional + silent. */
  silent?: boolean;
}

/** CommonOptionCreatorArgs with default/silent constrained. Use .optional() to mark optional. */
export type CommonOptionCreatorArgsConstrained<
  Name extends string,
  Schema extends z.ZodType,
> =
  | (CommonOptionCreatorArgs<Name, Schema> & OptionParamsWithDefault<Schema>)
  | (CommonOptionCreatorArgs<Name, Schema> & OptionParamsRequired);

export interface ZincOptionInternalDef<
  TName extends string = string,
  TSchema extends z.ZodType = z.ZodType,
> {
  /**
   * @description - ZincOption name.
   * Should be camelCase and will be the name passed of the variable passed to the command action
   *
   * @example
   * dryRun
   */
  name: TName;

  /**
   * @description - Commander flags.
   * These are the flags given to commander for argument parsing.
   *
   * @note
   * If Commander flags generate a name that does not match the name property, an error will be thrown.
   *
   * @example - Correct
   * -d, --dry-run --Commander Transforms to -> dryRun === 'dryRun' // Matches "name"
   *
   * @example - Incorrect
   * -d, --dryrun --Commander Transforms to -> dryrun !== 'dryRun' // Does not match "name"
   */
  flags: string;

  /**
   * @description - Description of the option.
   * This is the description of the option that will be displayed to the user.  Given to Commander
   * for help text generation.  Used by inquirer for prompt generation when no inquiry is provided
   *
   * @example
   * Run the command in dry run mode.
   */
  description: string;

  /**
   * @description - Zod schema.
   * This is the zod schema that will be used to validate and parse the final option value.
   * This schema should not produce `undefined` as output, meaning it should not be optional, or
   * have a default value.
   *
   * Optional and Default are controlled by the ZincOption which applies them to the schema at
   * time of parsing.
   *
   * @example
   * z.stringbool()
   */
  schema: TSchema;

  /**
   * @description - Default value.
   * This is an optional value that will be applied to the schema at time of parsing if present,
   * but will be `null` if no default is provided.
   *
   * @note - When a "default" value is provided, the option is in effect "optional".  Since it is
   * no longer necessary for the user to provide a value either via command line or via inquirer.
   */
  default: NoUndefined<z.output<TSchema>> | null;

  /**
   * @description - Optional flag.
   * This is a flag that will be applied to the schema at time of parsing if present. If true,
   * the option is optional and may be undefined after parsing.
   *
   * @note - When a "default" value is provided, the option is in effect "optional".  Since it is
   * no longer necessary for the user to provide a value either via command line or via inquirer.
   */
  optional: boolean;

  /**
   * @description - Silent flag.
   * When true, the option will be skipped during inquirer prompt generation. This means the option
   * can still be given a value via command line, but will not be prompted for via inquirer.
   */
  silent: boolean;

  /**
   * @description - Inquirer function.
   * This is the function that will be used to prompt the user for a value if no default is provided.
   *
   * @returns - A promise that resolves to the parsed value of the option.
   */
  inquire: () => Promise<unknown>;
}

export interface ZincOptionInternals<
  TName extends string,
  TSchema extends z.ZodType,
  TOutput = unknown,
> {
  _def: ZincOptionInternalDef<TName, TSchema>;

  /**
   * @description - Output type.
   * This is a convenience type that is used to store the type of the parsed value of the option.
   * It is derived from a combination of the schema, optional, and default _def properties.
   */
  output: TOutput;
}

/** Parsed output type for one option from schema + optional flag. */
export type OptionOutput<
  Schema extends z.ZodType,
  Optional extends boolean,
> = Optional extends true ? z.output<Schema> | undefined : z.output<Schema>;

/**
 * Plain object shape for a CLI option. Public API: name, commandOption, schema, inquire, getRegistrationObject.
 * Internal state and output type are under $InternalsBrand (Zod-style _zod pattern).
 */
export interface ZincOption<
  TName extends string,
  TSchema extends z.ZodType,
  TOptional extends boolean = false,
> {
  readonly [$InternalsBrand]: ZincOptionInternals<
    TName,
    TSchema,
    OptionOutput<TSchema, TOptional>
  >;
  readonly def: ZincOptionInternalDef<TName, TSchema>;
  readonly name: TName;
  readonly commandOption: Option;
  readonly schema: z.ZodType<OptionOutput<TSchema, TOptional>>;
  readonly inquire: () => Promise<unknown>;
  getRegistrationObject(): Record<
    TName,
    z.ZodType<OptionOutput<TSchema, TOptional>>
  >;
}

/**
 * Generic array of created ZincOption objects.  Used for function signatures that accept an array
 * of ZincOption objects.
 */
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

/**  Inferred output type of a ZincOption  (inspired by/stolen from Zod) */
export type CliInfer<
  TOption extends { [$InternalsBrand]: { output: unknown } },
> = TOption[InternalsBrandType]['output'];

export type MakeOptional<
  TOption extends ZincOption<string, z.ZodType, boolean>,
> =
  TOption extends ZincOption<infer InferredName, infer InferredSchema, boolean>
    ? TOption & ZincOption<InferredName, InferredSchema, true>
    : never;

export type AcceptableDefaultValueType<
  TOption extends ZincOption<string, z.ZodType, boolean>,
> =
  TOption extends ZincOption<string, z.ZodType, boolean>
    ? NoUndefined<z.output<TOption['def']['schema']>>
    : never;
