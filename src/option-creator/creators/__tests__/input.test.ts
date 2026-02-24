import { describe, expect, expectTypeOf, test } from 'vitest';
import { z } from 'zod';
import { OptionNameMismatchError } from '../../../errors';
import { $InternalsBrand } from '../../types';
import { Input } from '../input';

describe('Input Options', () => {
  describe('type checking', () => {
    test('does not allow creating an option with a schema that could produce undefined values', () => {
      // Schema that can produce undefined (e.g. z.string().optional()).
      const optionalStringSchema = z.string().optional();
      const inputArgsWithOptionalSchema = {
        name: 'test',
        flags: '--test <test>',
        description: 'Test',
        schema: optionalStringSchema,
      } as const;

      type InputFirstParam = Parameters<typeof Input>[0];
      // Args with a schema that can produce undefined must not be assignable to Input's first parameter.
      expectTypeOf(inputArgsWithOptionalSchema).not.toExtend<InputFirstParam>();

      // Input(invalid) must be a type error (consumed by @ts-expect-error).
      // @ts-expect-error - schema output must not include undefined
      Input(inputArgsWithOptionalSchema);
    });

    test("allows 'silent' parameter when given a default value", () => {
      Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.coerce.number(),
        default: 42,
        silent: true,
      });
    });

    test("allows 'silent' when using .optional().silent() chain", () => {
      const option = Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.coerce.number(),
      })
        .optional()
        .silent();
      expect(option.name).toBe('employerId');
    });

    test("does not allow 'silent' parameter when not given a default value", () => {
      // @ts-expect-error - silent only allowed when default is set
      Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.coerce.number(),
        silent: true,
      });
    });
  });

  describe('functionality', () => {
    test('preserves the given option name', () => {
      const option = Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.coerce.number(),
      });
      const name = option.name;
      expect(name).toBe('employerId');
      expectTypeOf(name).toEqualTypeOf<'employerId'>();
    });

    test('throws an OptionNameMismatchError if the given name does not match the name from the generated Commander option', () => {
      expect(() => {
        Input({
          name: 'foo',
          flags: '--employer-id <employerId>',
          description: 'Employer ID',
          schema: z.coerce.number(),
        });
      }).toThrow(OptionNameMismatchError);

      expect(() => {
        Input({
          name: 'employerId',
          flags: '--employer-id-foo <employerIdFoo>',
          description: 'Employer ID',
          schema: z.coerce.number(),
        });
      }).toThrow(OptionNameMismatchError);
    });

    test('preserves the given schema to use for parsing', () => {
      const firstOption = Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.coerce.number(),
      });

      expectTypeOf(firstOption.schema.parse).returns.toEqualTypeOf<number>();
      expect(firstOption.schema.parse('123')).toEqual(123);

      const secondOption = Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.stringbool(),
      });

      expectTypeOf(secondOption.schema.parse).returns.toEqualTypeOf<boolean>();
      expect(secondOption.schema.parse('true')).toBe(true);
    });

    test('uses the given default value for parsing when no value is provided', () => {
      const option = Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.coerce.number(),
        default: 42,
      });
      expect(option.schema.parse(undefined)).toBe(42);
    });

    test('generates a registration object with the option name as the key and the schema as the value', () => {
      const option = Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.coerce.number(),
      });
      const reg = option.getRegistrationObject();
      expect(reg).toHaveProperty('employerId');
      // Schema is built dynamically; assert it behaves the same (functional equivalence).
      expect(reg.employerId.parse('123')).toEqual(option.schema.parse('123'));
    });

    test('safely parses a value of undefined when option is created with .optional()', () => {
      const option = Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.coerce.number(),
      }).optional();
      expect(option.schema.parse(undefined)).toBeUndefined();
    });

    test('fails to parse a value of undefined when option is required (no .optional())', () => {
      const option = Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.coerce.number(),
      });
      expect(() => option.schema.parse(undefined)).toThrow();
    });

    test('safely parses a value of an empty string as undefined when option is created with .optional()', () => {
      const option = Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.string(),
      }).optional();
      expect(option.schema.parse('')).toBeUndefined();
    });

    test('fails to parse a value of an empty string when option is required (no .optional())', () => {
      const option = Input({
        name: 'employerId',
        flags: '--employer-id <employerId>',
        description: 'Employer ID',
        schema: z.string(),
      });
      expect(() => option.schema.parse('')).toThrow();
    });
  });

  describe('method chaining', () => {
    describe('optional', () => {
      test('returns a new instance', () => {
        const option = Input({
          name: 'employerId',
          flags: '--employer-id <employerId>',
          description: 'Employer ID',
          schema: z.coerce.number(),
        });
        const optionalOption = option.optional();
        expect(optionalOption).not.toBe(option);
        expect(optionalOption.name).toBe('employerId');
      });
      test('new instance successfully parses undefined and returns original default value when provided', () => {
        const option = Input({
          name: 'employerId',
          flags: '--employer-id <employerId>',
          description: 'Employer ID',
          schema: z.coerce.number(),
          default: 42,
        });
        const optionalOption = option.optional();
        expect(optionalOption.schema.parse(undefined)).toBe(42);
      });
      test('new instance successfully parses a value of an empty string and returns original default value when provided', () => {
        const option = Input({
          name: 'employerId',
          flags: '--employer-id <employerId>',
          description: 'Employer ID',
          schema: z.string(),
          default: 'fallback',
        });
        const optionalOption = option.optional();
        expect(optionalOption.schema.parse('')).toBe('fallback');
      });
      test('new instance successfully parses undefined and returns undefined when no default value was originally provided', () => {
        const option = Input({
          name: 'employerId',
          flags: '--employer-id <employerId>',
          description: 'Employer ID',
          schema: z.coerce.number(),
        });
        const optionalOption = option.optional();
        expect(optionalOption.schema.parse(undefined)).toBeUndefined();
      });
      test('new instance successfully parses a value of an empty string and returns undefined when no default value was originally provided', () => {
        const option = Input({
          name: 'employerId',
          flags: '--employer-id <employerId>',
          description: 'Employer ID',
          schema: z.string(),
        });
        const optionalOption = option.optional();
        expect(optionalOption.schema.parse('')).toBeUndefined();
      });
    });

    describe('silent', () => {
      test('returns a new instance', () => {
        const option = Input({
          name: 'employerId',
          flags: '--employer-id <employerId>',
          description: 'Employer ID',
          schema: z.coerce.number(),
          default: 42,
        });
        const silentOption = option.silent();
        expect(silentOption).not.toBe(option);
        expect(silentOption.name).toBe('employerId');
      });
      test('new instance silent property is set to true', () => {
        const option = Input({
          name: 'employerId',
          flags: '--employer-id <employerId>',
          description: 'Employer ID',
          schema: z.coerce.number(),
          default: 42,
        });
        const silentOption = option.silent() as any;

        expect(silentOption[$InternalsBrand]._def.silent).toBe(true);
      });
    });

    describe('default', () => {
      test('returns a new instance', () => {
        const option = Input({
          name: 'employerId',
          flags: '--employer-id <employerId>',
          description: 'Employer ID',
          schema: z.coerce.number(),
        });
        const withDefault = option.default(42);
        expect(withDefault).not.toBe(option);
        expect(withDefault.name).toBe('employerId');
      });

      test('new instance parses undefined as the default value', () => {
        const option = Input({
          name: 'employerId',
          flags: '--employer-id <employerId>',
          description: 'Employer ID',
          schema: z.coerce.number(),
        });
        const withDefault = option.default(42);
        expect(withDefault.schema.parse(undefined)).toBe(42);
      });
    });
  });
});
