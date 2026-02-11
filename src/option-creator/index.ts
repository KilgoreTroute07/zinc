import { z } from 'zod';
import { InvalidOptionTypeError } from '../errors';
import {
  BooleanCliOption,
  type BooleanOptionCreatorArgs,
} from './creators/boolean';
import { InputCliOption, type InputOptionCreatorArgs } from './creators/input';
import {
  SelectCliOption,
  type SelectOptionCreatorArgs,
} from './creators/select';
import { CliInfer, OptionType, ParsedOptions, ZincOptionArray } from './types';
import { buildEnvironmentSchemaFromOptions as BuildEnvironmentSchemaFromOptions } from './utils';
import { type ZincOption } from './zinc-option';

function CreateCliOption<Name extends string>(args: BooleanOptionCreatorArgs<Name>): BooleanCliOption<Name>; // prettier-ignore
function CreateCliOption<Name extends string, Schema extends z.ZodType>(args: InputOptionCreatorArgs<Name, Schema>): InputCliOption<Name, Schema>; // prettier-ignore
function CreateCliOption<Name extends string, Schema extends z.ZodType>(args: SelectOptionCreatorArgs<Name, Schema>): SelectCliOption<Name, Schema>; // prettier-ignore
function CreateCliOption<Name extends string, Schema extends z.ZodType>(
  args:
    | BooleanOptionCreatorArgs<Name>
    | InputOptionCreatorArgs<Name, Schema>
    | SelectOptionCreatorArgs<Name, Schema>
): ZincOption<string, z.ZodType, boolean> {
  if (args.type === 'input') {
    return InputCliOption(args);
  }

  if (args.type === 'boolean') {
    return BooleanCliOption(args);
  }

  if (args.type === 'select') {
    return SelectCliOption(args);
  }

  // Should not be possible to reach this line
  throw new InvalidOptionTypeError(args);
}
export default CreateCliOption;
export { BuildEnvironmentSchemaFromOptions, CreateCliOption };
export type {
  CliInfer,
  OptionType,
  ParsedOptions,
  ZincOption,
  ZincOptionArray,
};
