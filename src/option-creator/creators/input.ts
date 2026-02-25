import { input } from '@inquirer/prompts';
import { z } from 'zod';
import { InquirerInputConfig } from '../../types/inquirer';
import { NonUndefinedOutput, NoUndefined } from '../../utils/type-utils';
import type {
  AcceptableDefaultValueType,
  CommonOptionCreatorArgsConstrained,
  ZincOption,
} from '../types';
import { InternalsBrandType } from '../types';
import { setDefaults } from '../utils';
import createZincOption from '../zinc-option';

export type InputOptionCreatorArgs<
  Name extends string,
  Schema extends z.ZodType,
> =
  Schema extends NonUndefinedOutput<Schema>
    ? CommonOptionCreatorArgsConstrained<Name, Schema>
    : never;

// TODO: Switch this to interface to match other creators
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

function createOption<T extends ZincOption<string, z.ZodType, boolean>>(
  def: T[InternalsBrandType]['_def']
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance: any = createZincOption(def);

  instance.optional = () =>
    createOption({
      ...def,
      optional: true,
    });

  instance.silent = () =>
    createOption({
      ...def,
      silent: true,
    });

  instance.default = (value: AcceptableDefaultValueType<T>) =>
    createOption({
      ...def,
      default: value,
    });

  return instance;
}

export function Input<Name extends string, Schema extends z.ZodType>(
  args: InputOptionCreatorArgs<Name, Schema>
): InputCliOption<Name, Schema, false> {
  const { description, inquiry } = args;
  const inputOptions: InquirerInputConfig = {
    message: inquiry || `Enter ${description}`,
  };

  const standardizedDefinition = setDefaults({
    ...args,
    inquire: () => input(inputOptions),
  });

  return createOption(standardizedDefinition);
}
