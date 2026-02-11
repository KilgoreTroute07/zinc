import { input } from '@inquirer/prompts';
import { z } from 'zod';
import { InquirerInputConfig } from '../../types/inquirer';
import { NonUndefinedOutput, NoUndefined } from '../../utils/type-utils';
import { type CommonOptionCreatorArgsConstrained } from '../types';
import type { ZincOption } from '../zinc-option';
import createZincOption from '../zinc-option';

export type InputOptionCreatorArgs<
  Name extends string,
  Schema extends z.ZodType,
> =
  Schema extends NonUndefinedOutput<Schema>
    ? CommonOptionCreatorArgsConstrained<Name, Schema> & { type: 'input' }
    : never;

export type InputCliOption<
  Name extends string,
  Schema extends z.ZodType,
  Optional extends boolean = false,
> = ZincOption<Name, Schema, Optional> & {
  optional(): InputCliOption<Name, Schema, true>;
  silent(): InputCliOption<Name, Schema, Optional>;
  default(
    value: NoUndefined<z.output<Schema>>
  ): InputCliOption<Name, Schema, false>;
};

export function InputCliOption<Name extends string, Schema extends z.ZodType>(
  args: InputOptionCreatorArgs<Name, Schema>
): InputCliOption<
  Name,
  Schema,
  typeof args extends { optional: true } ? true : false
> {
  const { name, flags, description, schema, inquiry } = args;
  const inputOptions: InquirerInputConfig = {
    message: inquiry || `Enter ${description}`,
  };

  const base = createZincOption({
    name,
    flags,
    description,
    default: args.default,
    optional: args.optional,
    silent: args.silent,
    schema,
    inquire: async () => {
      const result = await input(inputOptions);
      const trimmedResult = result.trim();
      return trimmedResult.length > 0 ? trimmedResult : undefined;
    },
  } as Parameters<typeof createZincOption>[0]);

  return Object.assign(base, {
    optional(): InputCliOption<Name, Schema, true> {
      return InputCliOption({
        ...args,
        optional: true,
      } as InputOptionCreatorArgs<Name, Schema>);
    },
    silent(): InputCliOption<
      Name,
      Schema,
      typeof args extends { optional: true } ? true : false
    > {
      return InputCliOption({ ...args, silent: true });
    },
    default(
      value: NoUndefined<z.output<Schema>>
    ): InputCliOption<Name, Schema, false> {
      const { optional: _o, ...rest } = args;
      return InputCliOption({
        ...rest,
        default: value,
      } as InputOptionCreatorArgs<Name, Schema>) as InputCliOption<
        Name,
        Schema,
        false
      >;
    },
  }) as InputCliOption<
    Name,
    Schema,
    typeof args extends { optional: true } ? true : false
  >;
}
