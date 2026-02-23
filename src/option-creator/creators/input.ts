import { input } from '@inquirer/prompts';
import { z } from 'zod';
import { InquirerInputConfig } from '../../types/inquirer';
import {
  InferOptional,
  NonUndefinedOutput,
  NoUndefined,
} from '../../utils/type-utils';
import type { CommonOptionCreatorArgsConstrained, ZincOption } from '../types';
import { setDefaults } from '../utils';
import createZincOption from '../zinc-option';

export type InputOptionCreatorArgs<
  Name extends string,
  Schema extends z.ZodType,
> =
  Schema extends NonUndefinedOutput<Schema>
    ? CommonOptionCreatorArgsConstrained<Name, Schema>
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
  const { description, inquiry } = args;
  const inputOptions: InquirerInputConfig = {
    message: inquiry || `Enter ${description}`,
  };

  const standardizedDefinition = setDefaults({
    ...args,
    inquire: () => input(inputOptions),
  });

  const base = createZincOption(standardizedDefinition);

  return Object.assign(base, {
    optional(): InputCliOption<Name, Schema, true> {
      return InputCliOption({
        ...args,
        optional: true,
      });
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
  }) as InputCliOption<Name, Schema, InferOptional<typeof args>>;
}
