import { Option } from 'commander';
import { z } from 'zod';
import { OptionNameMismatchError } from '../errors';
import { NoUndefined } from '../utils/type-utils';

export const $BrandSymbol: unique symbol = Symbol('cli_option');
export type CliOptionBrand = typeof $BrandSymbol;

function createCommandOption<Name extends string>(args: {
  name: Name;
  flags: string;
  description: string;
}): Option {
  const { name, flags, description } = args;
  const commandOption = new Option(flags, description);
  const nameFromOption = commandOption.attributeName();
  if (nameFromOption !== name) {
    throw new OptionNameMismatchError(name, nameFromOption);
  }
  return commandOption;
}

/**
 * Internal definition stored under the brand. All "private" option state lives here.
 */
export interface CliOptionDef<Name extends string, Schema extends z.ZodType> {
  name: Name;
  flags: string;
  description: string;
  schema: Schema;
  default: NoUndefined<z.output<Schema>> | null;
  optional: boolean;
  silent: boolean;
  inquire: () => Promise<unknown>;
}

/**
 * Brand type (Zod-style): carries _def at runtime and output type for inference.
 * `output` is the parsed value type (T when required, T | undefined when optional).
 */
export interface CliOptionBrandInternals<
  Name extends string,
  Schema extends z.ZodType,
  Output,
> {
  _def: CliOptionDef<Name, Schema>;
  /** Type-level only: parsed value for this option. */
  output: Output;
}

/** Parsed output type for one option from schema + optional flag. */
export type OptionOutput<Schema extends z.ZodType, Optional extends boolean> = [
  Optional,
] extends [true]
  ? z.output<Schema> | undefined
  : z.output<Schema>;

/**
 * Plain object shape for a CLI option. Public API: name, commandOption, schema, inquire, getRegistrationObject.
 * Internal state and output type are under $BrandSymbol (Zod-style _zod pattern).
 */
export interface ZincOption<
  Name extends string,
  Schema extends z.ZodType,
  Optional extends boolean = false,
> {
  readonly [$BrandSymbol]: CliOptionBrandInternals<
    Name,
    Schema,
    OptionOutput<Schema, Optional>
  >;
  readonly name: Name;
  readonly commandOption: Option;
  readonly schema: z.ZodType<OptionOutput<Schema, Optional>>;
  readonly inquire: () => Promise<unknown>;
  getRegistrationObject(): Record<
    Name,
    z.ZodType<OptionOutput<Schema, Optional>>
  >;
}

/**
 * Option creators must pass a schema that does not produce `undefined` (enforced
 * by InputArgsNoUndefOutput / SelectArgsNoUndefOutput). The default, when provided,
 * must match the schema output (NoUndefined<z.output<Schema>>).
 */
export interface BaseCreatedOptionArgs<
  Name extends string,
  Schema extends z.ZodType,
> {
  name: Name;
  flags: string;
  description: string;
  schema: Schema;
  default?: NoUndefined<z.output<Schema>>;
  optional?: boolean;
  silent?: boolean;
  inquire: () => Promise<unknown>;
}

function buildSchema<Schema extends z.ZodType, Optional extends boolean>(
  def: CliOptionDef<string, Schema>
): z.ZodType<OptionOutput<Schema, Optional>> {
  let rest: z.ZodType = def.schema;
  if (def.default !== null) {
    rest = rest.default(def.default);
  }
  if (def.optional) {
    rest = rest.optional();
  }
  return z.preprocess((val: unknown) => {
    if (val === '') {
      return undefined;
    }

    return val;
  }, rest) as z.ZodType<OptionOutput<Schema, Optional>>;
}

/** Infers Optional literal from args (true when optional: true, else false). */
export type InferOptional<A extends { optional?: boolean }> = A extends {
  optional: true;
}
  ? true
  : false;

/**
 * Creates a plain-object CLI option. All "private" state is stored under [$BrandSymbol]._def.
 * The brand also carries the `output` type for ParsedOptions inference (type-level only).
 */
export function createZincOption<
  const Name extends string,
  Schema extends z.ZodType,
  const Def extends BaseCreatedOptionArgs<Name, Schema>,
>(args: Def): ZincOption<Name, Schema, InferOptional<Def>> {
  const _def: CliOptionDef<Name, Schema> = {
    name: args.name,
    flags: args.flags,
    description: args.description,
    schema: args.schema,
    default: args.default ?? null,
    optional: args.optional ?? false,
    silent: args.silent ?? false,
    inquire: args.inquire,
  };

  // Validate name vs Commander option at creation time (same as former class constructor).
  createCommandOption({
    name: _def.name,
    flags: _def.flags,
    description: _def.description,
  });

  type Opt = InferOptional<Def>;
  const brand: CliOptionBrandInternals<
    Name,
    Schema,
    OptionOutput<Schema, Opt>
  > = {
    _def,
    output: undefined as OptionOutput<Schema, Opt>,
  };

  const option = {
    [$BrandSymbol]: brand,
    get name(): Name {
      return (option[$BrandSymbol]._def as CliOptionDef<Name, Schema>).name;
    },
    get commandOption(): Option {
      const d = option[$BrandSymbol]._def as CliOptionDef<Name, Schema>;
      return createCommandOption({
        name: d.name,
        flags: d.flags,
        description: d.description,
      });
    },
    get schema(): z.ZodType<OptionOutput<Schema, Opt>> {
      return buildSchema(
        option[$BrandSymbol]._def as CliOptionDef<Name, Schema>
      );
    },
    get inquire() {
      const d = option[$BrandSymbol]._def as CliOptionDef<Name, Schema>;
      return d.silent ? async () => d.default ?? undefined : d.inquire;
    },
    getRegistrationObject(): Record<
      Name,
      z.ZodType<OptionOutput<Schema, Opt>>
    > {
      const name = (option[$BrandSymbol]._def as CliOptionDef<Name, Schema>)
        .name;
      return { [name]: option.schema } as Record<
        Name,
        z.ZodType<OptionOutput<Schema, Opt>>
      >;
    },
  } as ZincOption<Name, Schema, InferOptional<Def>>;

  return option;
}

export default createZincOption;
