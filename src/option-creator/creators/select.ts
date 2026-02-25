import { select } from '@inquirer/prompts';
import { z } from 'zod';
import { SelectChoiceInvalidError } from '../../errors';
import { InquirerSelectConfig } from '../../types/inquirer';
import { isObject } from '../../utils/object-utils';
import {
  type AcceptableDefaultValueType,
  type CommonOptionCreatorArgsConstrained,
  type ZincOption,
  $InternalsBrand,
  InternalsBrandType,
  MakeOptional,
  OptionOutput,
  ZincOptionInternals,
} from '../types';
import { setDefaults } from '../utils';
import createZincOption from '../zinc-option';

function createOption<T extends SelectCliOption<string, z.ZodType, boolean>>(
  def: T[InternalsBrandType]['_def']
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance: any = createZincOption(def);

  const instanceDefinition = {
    ...instance[$InternalsBrand]._def,
    choices: def.choices,
  } as const satisfies T[InternalsBrandType]['_def'];

  instance.optional = () =>
    createOption({
      ...instanceDefinition,
      optional: true,
    });

  instance.silent = () =>
    createOption({
      ...instanceDefinition,
      silent: true,
    });

  instance.default = (value: AcceptableDefaultValueType<T>) =>
    createOption({
      ...instanceDefinition,
      default: value,
    });

  return instance;
}

/** Select option args. Uses ConstructorArgs so overload resolution works (no NonUndefinedOutput conditional). */
export type SelectOptionCreatorArgs<
  Name extends string,
  Schema extends z.ZodType,
> = CommonOptionCreatorArgsConstrained<Name, Schema> & {
  choices: InquirerSelectConfig['choices'];
};

export interface SelectCliOption<
  TName extends string,
  TSchema extends z.ZodType,
  TOptional extends boolean = false,
> extends ZincOption<TName, TSchema, TOptional> {
  readonly [$InternalsBrand]: ZincOptionInternals<
    TName,
    TSchema,
    OptionOutput<TSchema, TOptional>
  > & {
    _def: {
      choices: InquirerSelectConfig['choices'];
    };
  };

  optional(): MakeOptional<this>;
  silent(): this;
  default(
    value: AcceptableDefaultValueType<this>
  ): SelectCliOption<TName, TSchema, false>;
}

export function Select<Name extends string, Schema extends z.ZodType>(
  args: SelectOptionCreatorArgs<Name, Schema>
): SelectCliOption<Name, Schema, false> {
  const { name, description, choices, schema, inquiry } = args;
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

  const standardizedDefinition = setDefaults({
    ...args,
    schema,
    inquire: () => select(selectOptions),
  });

  return createOption({
    ...standardizedDefinition,
    choices,
  });
}
