import { describe, expect, expectTypeOf, test } from 'vitest';
import { z } from 'zod';
import { OptionNameMismatchError } from '../../../errors';
import { $InternalsBrand } from '../../types';
import { Select } from '../select';

describe('Select Options', () => {
  describe('type checking', () => {
    test('allows creating a select option (schema output constraint not enforced at type level for overload resolution)', () => {
      // SelectOptionCreatorArgs does not use NonUndefinedOutput so overload resolution works.
      const optionalStringSchema = z.string().optional();
      const selectArgsWithOptionalSchema = {
        name: 'env',
        flags: '--env [env]',
        description: 'Environment',
        schema: optionalStringSchema,
        default: 'stage',
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
      } as const;

      const option = Select(selectArgsWithOptionalSchema);
      expect(option.name).toBe('env');
    });

    test("does not allow 'optional' in creator args (use .optional() method instead)", () => {
      Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
        // @ts-expect-error - optional is not a valid creator arg, use .optional() instead
        optional: true,
      });
    });

    test("allows 'silent' parameter when given a default value", () => {
      Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        default: 'stage',
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
        silent: true,
      });
    });

    test("allows 'silent' when using .optional().silent() chain", () => {
      const option = Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
      })
        .optional()
        .silent();
      expect(option.name).toBe('env');
    });

    test("does not allow 'silent' parameter when not given a default value", () => {
      // @ts-expect-error - silent only allowed when default is set
      Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
        silent: true,
      });
    });
  });

  describe('functionality', () => {
    test('preserves the given option name', () => {
      const option = Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        default: 'stage',
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
      });
      const name = option.name;
      expect(name).toBe('env');
      expectTypeOf(name).toEqualTypeOf<'env'>();
    });

    test('throws an OptionNameMismatchError if the given name does not match the name from the generated Commander option', () => {
      expect(() => {
        Select({
          name: 'foo',
          flags: '-e, --env [environment]',
          description: 'Environment (prod or stage)',
          schema: z
            .string()
            .toLowerCase()
            .pipe(z.enum(['prod', 'stage'])),
          default: 'stage',
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        });
      }).toThrow(OptionNameMismatchError);

      expect(() => {
        Select({
          name: 'env',
          flags: '--env-foo [environmentFoo]',
          description: 'Environment (prod or stage)',
          schema: z
            .string()
            .toLowerCase()
            .pipe(z.enum(['prod', 'stage'])),
          default: 'stage',
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        });
      }).toThrow(OptionNameMismatchError);
    });

    test('preserves the given schema to use for parsing', () => {
      const option = Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        default: 'stage',
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
      });
      expectTypeOf(option.schema.parse).returns.toEqualTypeOf<
        'stage' | 'prod'
      >();
      expect(option.schema.parse('stage')).toBe('stage');
    });

    test('uses the given default value for parsing when no value is provided', () => {
      const option = Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        default: 'stage',
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
      });
      expect(option.schema.parse(undefined)).toBe('stage');
    });

    test('generates a registration object with the option name as the key and the schema as the value', () => {
      const option = Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        default: 'stage',
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
      });
      const reg = option.getRegistrationObject();
      expect(reg).toHaveProperty('env');
      // Schema is built dynamically; assert it behaves the same (functional equivalence).
      expect(reg.env.parse(undefined)).toEqual(option.schema.parse(undefined));
      expect(reg.env.parse('stage')).toEqual(option.schema.parse('stage'));
    });

    test('safely parses a value of undefined when option is created with .optional()', () => {
      const option = Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
      }).optional();
      expect(option.schema.parse(undefined)).toBe(undefined);
    });

    test('fails to parse a value of undefined when option is required (no .optional())', () => {
      const option = Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
      });
      expect(() => option.schema.parse(undefined)).toThrow();
    });

    test('safely parses a value of an empty string as undefined when option is created with .optional()', () => {
      const option = Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
      }).optional();
      expect(option.schema.parse('')).toBeUndefined();
    });

    test('fails to parse a value of an empty string when option is required (no .optional())', () => {
      const option = Select({
        name: 'env',
        flags: '-e, --env [environment]',
        description: 'Environment (prod or stage)',
        schema: z
          .string()
          .toLowerCase()
          .pipe(z.enum(['prod', 'stage'])),
        inquiry: 'Select the environment to use',
        choices: [
          { name: 'stage', value: 'stage' },
          { name: 'prod', value: 'prod' },
        ],
      });

      expect(() => option.schema.parse('')).toThrow();
    });
  });

  describe('method chaining', () => {
    describe('optional', () => {
      test('returns a new instance', () => {
        const option = Select({
          name: 'env',
          flags: '-e, --env [environment]',
          description: 'Environment (prod or stage)',
          schema: z
            .string()
            .toLowerCase()
            .pipe(z.enum(['prod', 'stage'])),
          default: 'stage',
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        });
        const optionalOption = option.optional();
        expect(optionalOption).not.toBe(option);
        expect(optionalOption.name).toBe('env');
      });
      test('new instance successfully parses undefined and returns original default value when provided', () => {
        const option = Select({
          name: 'env',
          flags: '-e, --env [environment]',
          description: 'Environment (prod or stage)',
          schema: z
            .string()
            .toLowerCase()
            .pipe(z.enum(['prod', 'stage'])),
          default: 'stage',
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        });
        const optionalOption = option.optional();
        expect(optionalOption.schema.parse(undefined)).toBe('stage');
      });
      test('new instance successfully parses a value of an empty string and returns original default value when provided', () => {
        const option = Select({
          name: 'env',
          flags: '-e, --env [environment]',
          description: 'Environment (prod or stage)',
          schema: z.string().pipe(z.enum(['prod', 'stage'])),
          default: 'stage',
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        });
        const optionalOption = option.optional();
        expect(optionalOption.schema.parse('')).toBe('stage');
      });
      test('new instance successfully parses undefined and returns undefined when no default value was originally provided', () => {
        const option = Select({
          name: 'env',
          flags: '-e, --env [environment]',
          description: 'Environment (prod or stage)',
          schema: z
            .string()
            .toLowerCase()
            .pipe(z.enum(['prod', 'stage'])),
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        });
        const optionalOption = option.optional();
        expect(optionalOption.schema.parse(undefined)).toBeUndefined();
      });
      test('new instance successfully parses a value of an empty string and returns undefined when no default value was originally provided', () => {
        const option = Select({
          name: 'env',
          flags: '-e, --env [environment]',
          description: 'Environment (prod or stage)',
          schema: z.string().pipe(z.enum(['prod', 'stage'])),
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        });
        const optionalOption = option.optional();
        expect(optionalOption.schema.parse('')).toBeUndefined();
      });
    });

    describe('silent', () => {
      test('returns a new instance', () => {
        const option = Select({
          name: 'env',
          flags: '-e, --env [environment]',
          description: 'Environment (prod or stage)',
          schema: z
            .string()
            .toLowerCase()
            .pipe(z.enum(['prod', 'stage'])),
          default: 'stage',
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        });
        const silentOption = option.silent();
        expect(silentOption).not.toBe(option);
        expect(silentOption.name).toBe('env');
      });
      test('new instance silent property is set to true', () => {
        const option = Select({
          name: 'env',
          flags: '-e, --env [environment]',
          description: 'Environment (prod or stage)',
          schema: z
            .string()
            .toLowerCase()
            .pipe(z.enum(['prod', 'stage'])),
          default: 'stage',
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        });
        const silentOption = option.silent() as any;

        expect(silentOption[$InternalsBrand]._def.silent).toBe(true);
      });
    });

    describe('default', () => {
      test('returns a new instance', () => {
        const option = Select({
          name: 'env',
          flags: '-e, --env [environment]',
          description: 'Environment (prod or stage)',
          schema: z
            .string()
            .toLowerCase()
            .pipe(z.enum(['prod', 'stage'])),
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        });
        const withDefault = option.default('stage');
        expect(withDefault).not.toBe(option);
        expect(withDefault.name).toBe('env');
      });

      test('new instance parses undefined as the default value', () => {
        const option = Select({
          name: 'env',
          flags: '-e, --env [environment]',
          description: 'Environment (prod or stage)',
          schema: z
            .string()
            .toLowerCase()
            .pipe(z.enum(['prod', 'stage'])),
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        });
        const withDefault = option.default('stage');
        expect(withDefault.schema.parse(undefined)).toBe('stage');
      });
    });
  });
});
