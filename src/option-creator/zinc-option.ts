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
        default: args.default,
        optional: args.optional,
        silent: args.silent,
        inquire: args.inquire,
      },
    },

    get def(): ZincOptionInternalDef<Name, Schema> {
      return option[$InternalsBrand]._def;
    },

    get name(): Name {
      return option[$InternalsBrand]._def.name;
    },

    get commandOption(): Option {
      return createCommandOption({
        name: option.name,
        flags: option.def.flags,
        description: option.def.description,
      });
    },

    get schema(): z.ZodType<OptionOutput<Schema, Opt>> {
      return buildSchema(option.def);
    },

    get inquire() {
      return option.def.silent
        ? async () => option.def.default ?? undefined
        : option.def.inquire;
    },

    getRegistrationObject(): Record<
      Name,
      z.ZodType<OptionOutput<Schema, Opt>>
    > {
      return { [option.name]: option.schema } as Record<
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
