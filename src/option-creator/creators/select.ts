import { select } from '@inquirer/prompts';
import { z } from 'zod';
import { SelectChoiceInvalidError } from '../../errors';
import { InquirerSelectConfig } from '../../types/inquirer';
import { isObject } from '../../utils/object-utils';
import { NoUndefined } from '../../utils/type-utils';
import { type CommonOptionCreatorArgsConstrained } from '../types';
import createZincOption, { ZincOption } from '../zinc-option';

/** Select option args. Uses ConstructorArgs so overload resolution works (no NonUndefinedOutput conditional). */
export type SelectOptionCreatorArgs<
  Name extends string,
  Schema extends z.ZodType,
> = CommonOptionCreatorArgsConstrained<Name, Schema> & {
  choices: InquirerSelectConfig['choices'];
};

export type SelectCliOption<
  Name extends string,
  Schema extends z.ZodType,
  Optional extends boolean = false,
> = ZincOption<Name, Schema, Optional> & {
  optional(): SelectCliOption<Name, Schema, true>;
  silent(): SelectCliOption<Name, Schema, Optional>;
  default(
    value: NoUndefined<z.output<Schema>>
  ): SelectCliOption<Name, Schema, false>;
};

export function SelectCliOption<Name extends string, Schema extends z.ZodType>(
  args: SelectOptionCreatorArgs<Name, Schema>
): SelectCliOption<
  Name,
  Schema,
  typeof args extends { optional: true } ? true : false
> {
  const { name, flags, description, choices, schema, inquiry } = args;
  const selectOptions: InquirerSelectConfig = {
    message: inquiry || `Select ${description}`,
    choices,
  };
  const choiceValues = choices
    .map((choice) => {
      if (typeof choice !== 'string' && !isObject(choice)) {
        return null;
      }

      return typeof choice === 'string' ? choice : choice.value;
    })
    .filter((choice): choice is string => choice !== null);

  for (const choice of choiceValues) {
    const trialParse = schema.safeParse(choice);
    if (!trialParse.success) {
      throw new SelectChoiceInvalidError(choice, name);
    }
  }

  const defaultChoice = !args.default
    ? undefined
    : choiceValues.find((choice) => choice === args.default);

  if (defaultChoice) {
    selectOptions.default = defaultChoice;
  }

  const base = createZincOption({
    name,
    flags,
    description,
    default: args.default,
    optional: args.optional,
    silent: args.silent,
    schema,
    inquire: () => select(selectOptions),
  } as Parameters<typeof createZincOption>[0]);

  return Object.assign(base, {
    optional(): SelectCliOption<Name, Schema, true> {
      return SelectCliOption({
        ...args,
        optional: true,
      } as SelectOptionCreatorArgs<Name, Schema>);
    },
    silent(): SelectCliOption<
      Name,
      Schema,
      typeof args extends { optional: true } ? true : false
    > {
      return SelectCliOption({
        ...args,
        silent: true,
      } as SelectOptionCreatorArgs<Name, Schema>);
    },
    default(
      value: NoUndefined<z.output<Schema>>
    ): SelectCliOption<Name, Schema, false> {
      const { optional: _o, ...rest } = args;
      return SelectCliOption({
        ...rest,
        default: value,
      } as SelectOptionCreatorArgs<Name, Schema>);
    },
  }) as SelectCliOption<
    Name,
    Schema,
    typeof args extends { optional: true } ? true : false
  >;
}
