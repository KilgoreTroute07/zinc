import { confirm } from '@inquirer/prompts';
import { z } from 'zod';
import { InquirerConfirmConfig } from '../../types/inquirer';
import type {
  CreateCommandOptionArgs,
  OptionParamsRequired,
  OptionParamsWithDefault,
} from '../types';
import type { ZincOption } from '../zinc-option';
import createZincOption from '../zinc-option';

const BooleanSchema = z.stringbool().or(z.boolean());
export type BooleanSchemaType = typeof BooleanSchema;

/** Boolean options do not support the optional parameter. */
type BooleanOptionParams =
  | (OptionParamsWithDefault<BooleanSchemaType> & { optional?: never })
  | (OptionParamsRequired & { optional?: never });

export type BooleanOptionCreatorArgs<Name extends string> =
  CreateCommandOptionArgs<Name> & {
    inquiry?: string;
    type: 'boolean';
  } & BooleanOptionParams;

export type BooleanCliOption<Name extends string> = ZincOption<
  Name,
  BooleanSchemaType,
  false
> & {
  silent(): BooleanCliOption<Name>;
  default(value: boolean): BooleanCliOption<Name>;
};

export function BooleanCliOption<Name extends string>(
  args: BooleanOptionCreatorArgs<Name>
): BooleanCliOption<Name> {
  const { description, inquiry } = args;
  const confirmOptions: InquirerConfirmConfig = {
    message: inquiry || `Enter ${description}`,
    default: args.default ?? false,
  };

  const base = createZincOption({
    name: args.name,
    flags: args.flags,
    description: args.description,
    schema: BooleanSchema,
    default: args.default ?? false,
    silent: args.silent,
    inquire: () => confirm(confirmOptions),
  } as Parameters<typeof createZincOption>[0]);

  return Object.assign(base, {
    silent(): BooleanCliOption<Name> {
      return BooleanCliOption({
        ...args,
        silent: true,
      } as BooleanOptionCreatorArgs<Name>);
    },
    default(value: boolean): BooleanCliOption<Name> {
      return BooleanCliOption({
        ...args,
        default: value,
      } as BooleanOptionCreatorArgs<Name>);
    },
  }) as BooleanCliOption<Name>;
}
