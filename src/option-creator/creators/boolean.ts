import { confirm } from '@inquirer/prompts';
import { z } from 'zod';
import { InquirerConfirmConfig } from '../../types/inquirer';
import type {
  OptionParamsRequired,
  OptionParamsWithDefault,
  ZincOption,
  ZincOptionInternalDef,
} from '../types';
import { InternalsBrandType } from '../types';
import { setDefaults } from '../utils';
import createZincOption from '../zinc-option';

const BooleanSchema = z.stringbool().or(z.boolean());
export type BooleanSchemaType = typeof BooleanSchema;

type BooleanOptionParams =
  | OptionParamsWithDefault<BooleanSchemaType>
  | OptionParamsRequired;

type BooleanOptionCreatorArgs<TName extends string> = {
  name: ZincOptionInternalDef<TName>['name'];
  flags: ZincOptionInternalDef['flags'];
  description: ZincOptionInternalDef['description'];
  inquiry?: string;
} & BooleanOptionParams;

/**
 * BooleanClipOption
 * @note - Optional
 * No boolean option can be "optional".  Any boolean option that is not passed via the
 * command line or via inquirer will default to the given default value, or false if no default
 * is provided.
 *
 * @note - Silent
 * A boolean option can be "silent".  This means that the option will not be prompted for via
 * inquirer.  This is useful for boolean options that are only passed via the command line.
 *
 * @note - Default
 * A boolean option can have a default value.  This means that the option will default to the
 * given default value if no value is provided via the command line or via inquirer.
 */
export interface BooleanCliOption<TName extends string> extends ZincOption<
  TName,
  BooleanSchemaType,
  false
> {
  silent(): this;
  default(value: boolean): BooleanCliOption<TName>;
}

function createOption<T extends ZincOption<string, z.ZodType, boolean>>(
  def: T[InternalsBrandType]['_def']
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance: any = createZincOption(def);

  instance.silent = () =>
    createOption({
      ...def,
      silent: true,
    });

  instance.default = (value: boolean) =>
    createOption({
      ...def,
      default: value,
    });

  return instance;
}

export function Boolean<const TName extends string>(
  args: BooleanOptionCreatorArgs<TName>
): BooleanCliOption<TName> {
  const { description, inquiry } = args;
  const confirmOptions: InquirerConfirmConfig = {
    message: inquiry || `Enter ${description}`,
    default: args.default ?? false,
  };
  const standardizedDefinition = setDefaults({
    ...args,
    schema: BooleanSchema,
    inquire: () => confirm(confirmOptions),
    default: args.default ?? false,
    optional: false,
  });

  return createOption(standardizedDefinition);
}
