import { Option } from 'commander';
import { z } from 'zod';
import { OptionNameMismatchError } from '../errors';
import { InferOptional } from '../utils/type-utils';
import {
  $InternalsBrand,
  OptionOutput,
  ZincOption,
  ZincOptionInternalDef,
} from './types';

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

function buildSchema<Schema extends z.ZodType, Optional extends boolean>(
  def: ZincOptionInternalDef<string, Schema>
): z.ZodType<OptionOutput<Schema, Optional>> {
  let finalSchema: z.ZodType = def.schema;

  if (def.default !== null) {
    finalSchema = finalSchema.default(def.default);
  }

  if (def.optional) {
    finalSchema = finalSchema.optional();
  }

  return z.preprocess(
    (val: unknown) => (val === '' ? undefined : val),
    finalSchema
  ) as z.ZodType<OptionOutput<Schema, Optional>>;
}

/**
 * Creates a plain-object CLI option. All "private" state is stored under [$InternalsBrand]._def.
 * The brand also carries the `output` type for ParsedOptions inference (type-level only).
 */
export function createZincOption<
  const Name extends string,
  const Schema extends z.ZodType,
  const Def extends ZincOptionInternalDef<Name, Schema>,
>(args: Def): ZincOption<Name, Schema, InferOptional<Def>> {
  type Opt = InferOptional<Def>;
  const option = {
    [$InternalsBrand]: {
      _def: {
        name: args.name,
        flags: args.flags,
        description: args.description,
        schema: args.schema,
        default: args.default ?? null,
        optional: args.optional ?? false,
        silent: args.silent ?? false,
        inquire: args.inquire,
      },
    },

    get name(): Name {
      return option[$InternalsBrand]._def.name;
    },

    get commandOption(): Option {
      const d = option[$InternalsBrand]._def;
      return createCommandOption({
        name: d.name,
        flags: d.flags,
        description: d.description,
      });
    },

    get schema(): z.ZodType<OptionOutput<Schema, Opt>> {
      return buildSchema(option[$InternalsBrand]._def);
    },

    get inquire() {
      const d = option[$InternalsBrand]._def;

      return d.silent ? async () => d.default ?? undefined : d.inquire;
    },

    getRegistrationObject(): Record<
      Name,
      z.ZodType<OptionOutput<Schema, Opt>>
    > {
      const name = (
        option[$InternalsBrand]._def as ZincOptionInternalDef<Name, Schema>
      ).name;
      return { [name]: option.schema } as Record<
        Name,
        z.ZodType<OptionOutput<Schema, Opt>>
      >;
    },
  } as ZincOption<Name, Schema, InferOptional<Def>>;

  // Validate name vs Commander option at creation time (same as former class constructor).
  createCommandOption({
    name: option[$InternalsBrand]._def.name,
    flags: option[$InternalsBrand]._def.flags,
    description: option[$InternalsBrand]._def.description,
  });

  return option;
}

export default createZincOption;
