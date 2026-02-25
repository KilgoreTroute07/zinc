import { Boolean } from './creators/boolean';
import { Input } from './creators/input';
import { Select } from './creators/select';
import type { ZincOption } from './types';
import { CliInfer, ParsedOptions, ZincOptionArray } from './types';
import { buildEnvironmentSchemaFromOptions as BuildEnvironmentSchemaFromOptions } from './utils';

const ZincOptionCreators = {
  input: Input,
  boolean: Boolean,
  select: Select,
} as const;
export default ZincOptionCreators;
export { BuildEnvironmentSchemaFromOptions, ZincOptionCreators };
export type { CliInfer, ParsedOptions, ZincOption, ZincOptionArray };
