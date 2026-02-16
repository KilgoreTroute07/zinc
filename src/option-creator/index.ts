import { BooleanCliOption } from './creators/boolean';
import { InputCliOption } from './creators/input';
import { SelectCliOption } from './creators/select';
import { CliInfer, OptionType, ParsedOptions, ZincOptionArray } from './types';
import { buildEnvironmentSchemaFromOptions as BuildEnvironmentSchemaFromOptions } from './utils';
import { type ZincOption } from './zinc-option';

const ZincOptionCreators = {
  input: InputCliOption,
  boolean: BooleanCliOption,
  select: SelectCliOption,
} as const;
export default ZincOptionCreators;
export { BuildEnvironmentSchemaFromOptions, ZincOptionCreators };
export type {
  CliInfer,
  OptionType,
  ParsedOptions,
  ZincOption,
  ZincOptionArray,
};
