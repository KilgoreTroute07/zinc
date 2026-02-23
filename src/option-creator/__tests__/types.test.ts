import { describe, expect, expectTypeOf, test } from 'vitest';
import { z } from 'zod';
import { BooleanCliOption } from '../creators/boolean';
import { InputCliOption } from '../creators/input';
import type { CliInfer, ZincOption } from '../types';

describe('CliInfer', () => {
  test('infers output type from a required string ZincOption', () => {
    const option = InputCliOption({
      name: 'name',
      flags: '--name',
      description: 'Name',
      schema: z.string(),
    });
    expect(option.name).toBe('name');
    expectTypeOf<CliInfer<typeof option>>().toEqualTypeOf<string>();
  });

  test.skip('infers output type from an optional string ZincOption', () => {
    const option = InputCliOption({
      name: 'name',
      flags: '--name',
      description: 'Name',
      schema: z.string(),
      optional: true,
    });
    expect(option.name).toBe('name');

    expectTypeOf<CliInfer<typeof option>>().toEqualTypeOf<string | undefined>();
  });

  test('infers output type from a boolean ZincOption with default', () => {
    const option = BooleanCliOption({
      name: 'dryRun',
      flags: '-d, --dry-run',
      description: 'Dry run',
      default: true,
    });
    expect(option.name).toBe('dryRun');
    expectTypeOf<CliInfer<typeof option>>().toEqualTypeOf<boolean>();
  });

  test('preserves literal name in option type but CliInfer only extracts output', () => {
    const option = InputCliOption({
      name: 'dryRun',
      flags: '--dry-run',
      description: 'Dry run',
      schema: z.boolean(),
    });
    expect(option.name).toBe('dryRun');
    expectTypeOf<typeof option>().toExtend<
      ZincOption<string, z.ZodType, boolean>
    >();
    expectTypeOf<CliInfer<typeof option>>().toEqualTypeOf<boolean>();
  });
});
