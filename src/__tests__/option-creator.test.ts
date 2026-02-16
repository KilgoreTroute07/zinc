/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, expectTypeOf, test } from 'vitest';
import { z } from 'zod';
import { OptionNameMismatchError } from '../errors';
import { CreateCliOption } from '../option-creator';
import { $BrandSymbol } from '../option-creator/zinc-option';

describe('CreateCliOption', () => {
  describe('Input Options', () => {
    const EmployerIdArgs = {
      name: 'employerId',
      flags: '--employer-id <employerId>',
      type: 'input',
      description: 'Employer ID',
      schema: z.coerce.number(),
    } as const;

    describe('type checking', () => {
      test('does not allow creating an option with a schema that could produce undefined values', () => {
        // Schema that can produce undefined (e.g. z.string().optional()).
        const optionalStringSchema = z.string().optional();
        const inputArgsWithOptionalSchema = {
          name: 'test',
          flags: '--test <test>',
          type: 'input',
          description: 'Test',
          schema: optionalStringSchema,
        } as const;

        type CreateCliOptionFirstParam = Parameters<typeof CreateCliOption>[0];
        // Args with a schema that can produce undefined must not be assignable to CreateCliOption's first parameter.
        expectTypeOf(
          inputArgsWithOptionalSchema
        ).not.toExtend<CreateCliOptionFirstParam>();

        // CreateCliOption(invalid) must be a type error (consumed by @ts-expect-error).
        // @ts-expect-error - schema output must not include undefined
        CreateCliOption(inputArgsWithOptionalSchema);
      });

      test("allows 'optional' parameter when not given a default value", () => {
        CreateCliOption({ ...EmployerIdArgs, optional: true });
      });

      test("does not allow 'optional' parameter when given a default value", () => {
        // @ts-expect-error - optional and default are mutually exclusive
        CreateCliOption({ ...EmployerIdArgs, default: 42, optional: true });
      });

      test("allows 'silent' parameter when given a default value", () => {
        CreateCliOption({
          ...EmployerIdArgs,
          default: 42,
          silent: true,
        });
      });

      test("allows 'silent' parameter when not given a default value and optional parameter is set to true", () => {
        CreateCliOption({
          ...EmployerIdArgs,
          optional: true,
          silent: true,
        });
      });

      test("does not allow 'silent' parameter when not given a default value and optional parameter is set to false", () => {
        // @ts-expect-error - silent only allowed when default or optional: true
        CreateCliOption({
          ...EmployerIdArgs,
          optional: false,
          silent: true,
        });
      });

      test("does not allow 'silent' parameter when not given a default value and optional parameter not set", () => {
        // @ts-expect-error - silent only allowed when default or optional: true
        CreateCliOption({ ...EmployerIdArgs, silent: true });
      });
    });

    describe('functionality', () => {
      test('preserves the given option name', () => {
        const EmployerId = CreateCliOption(EmployerIdArgs);
        const employerIdName = EmployerId.name;
        expect(employerIdName).toBe('employerId');
        expectTypeOf(employerIdName).toEqualTypeOf<'employerId'>();
      });

      test('throws an OptionNameMismatchError if the given name does not match the name from the generated Commander option', () => {
        expect(() => {
          CreateCliOption({
            ...EmployerIdArgs,
            name: 'foo',
          });
        }).toThrow(OptionNameMismatchError);

        expect(() => {
          CreateCliOption({
            ...EmployerIdArgs,
            flags: '--employer-id-foo <employerIdFoo>',
          });
        }).toThrow(OptionNameMismatchError);
      });

      test('preserves the given schema to use for parsing', () => {
        const firstOption = CreateCliOption(EmployerIdArgs);

        expectTypeOf(firstOption.schema.parse).returns.toEqualTypeOf<number>();
        expect(firstOption.schema.parse('123')).toEqual(123);

        const secondOption = CreateCliOption({
          ...EmployerIdArgs,
          schema: z.stringbool(),
        });

        expectTypeOf(
          secondOption.schema.parse
        ).returns.toEqualTypeOf<boolean>();
        expect(secondOption.schema.parse('true')).toBe(true);
      });

      test('uses the given default value for parsing when no value is provided', () => {
        const option = CreateCliOption({
          ...EmployerIdArgs,
          default: 42,
        });
        expect(option.schema.parse(undefined)).toBe(42);
      });

      test('generates a registration object with the option name as the key and the schema as the value', () => {
        const option = CreateCliOption(EmployerIdArgs);
        const reg = option.getRegistrationObject();
        expect(reg).toHaveProperty('employerId');
        // Schema is built dynamically; assert it behaves the same (functional equivalence).
        expect(reg.employerId.parse('123')).toEqual(option.schema.parse('123'));
      });

      test('safely parses a value of undefined when optional parameter is set to true', () => {
        const option = CreateCliOption({
          ...EmployerIdArgs,
          optional: true,
        });
        expect(option.schema.parse(undefined)).toBeUndefined();
      });

      test('fails to parse a value of undefined when optional parameter is set to false', () => {
        const option = CreateCliOption({
          ...EmployerIdArgs,
          optional: false,
        });
        expect(() => option.schema.parse(undefined)).toThrow();
      });

      test('fails to parse a value of undefined when optional parameter is not set', () => {
        const option = CreateCliOption(EmployerIdArgs);
        expect(() => option.schema.parse(undefined)).toThrow();
      });

      test('safely parses a value of an empty string as undefined when optional parameter is set to true', () => {
        const option = CreateCliOption({
          ...EmployerIdArgs,
          schema: z.string(),
          optional: true,
        });
        expect(option.schema.parse('')).toBeUndefined();
      });

      test('fails to parse a value of an empty string when optional parameter is set to false', () => {
        const option = CreateCliOption({
          ...EmployerIdArgs,
          schema: z.string(),
          optional: false,
        });
        expect(() => option.schema.parse('')).toThrow();
      });

      test('fails to parse a value of an empty string when optional parameter is not set', () => {
        const option = CreateCliOption({
          ...EmployerIdArgs,
          schema: z.string(),
        });
        expect(() => option.schema.parse('')).toThrow();
      });
    });

    describe('method chaining', () => {
      describe('optional', () => {
        test('returns a new instance', () => {
          const EmployerId = CreateCliOption(EmployerIdArgs);
          const SecondEmployerId = EmployerId.optional();
          expect(SecondEmployerId).not.toBe(EmployerId);
          expect(SecondEmployerId.name).toBe('employerId');
        });
        test('new instance successfully parses undefined and returns original default value when provided', () => {
          const option = CreateCliOption({
            ...EmployerIdArgs,
            default: 42,
          });
          const optionalOption = option.optional();
          expect(optionalOption.schema.parse(undefined)).toBe(42);
        });
        test('new instance successfully parses a value of an empty string and returns original default value when provided', () => {
          const option = CreateCliOption({
            ...EmployerIdArgs,
            schema: z.string(),
            default: 'fallback',
          });
          const optionalOption = option.optional();
          expect(optionalOption.schema.parse('')).toBe('fallback');
        });
        test('new instance successfully parses undefined and returns undefined when no default value was originally provided', () => {
          const EmployerId = CreateCliOption(EmployerIdArgs);
          const SecondEmployerId = EmployerId.optional();
          expect(SecondEmployerId.schema.parse(undefined)).toBeUndefined();
        });
        test('new instance successfully parses a value of an empty string and returns undefined when no default value was originally provided', () => {
          const option = CreateCliOption({
            ...EmployerIdArgs,
            schema: z.string(),
          });
          const optionalOption = option.optional();
          expect(optionalOption.schema.parse('')).toBeUndefined();
        });
      });

      describe('silent', () => {
        test('returns a new instance', () => {
          const option = CreateCliOption({
            ...EmployerIdArgs,
            default: 42,
          });
          const silentOption = option.silent();
          expect(silentOption).not.toBe(option);
          expect(silentOption.name).toBe('employerId');
        });
        test('new instance silent property is set to true', () => {
          const option = CreateCliOption({
            ...EmployerIdArgs,
            default: 42,
          });
          const silentOption = option.silent() as any;

          expect(silentOption[$BrandSymbol]._def.silent).toBe(true);
        });
      });

      describe('default', () => {
        test('returns a new instance', () => {
          const EmployerId = CreateCliOption(EmployerIdArgs);
          const WithDefault = EmployerId.default(42);
          expect(WithDefault).not.toBe(EmployerId);
          expect(WithDefault.name).toBe('employerId');
        });

        test('new instance parses undefined as the default value', () => {
          const EmployerId = CreateCliOption(EmployerIdArgs);
          const WithDefault = EmployerId.default(42);
          expect(WithDefault.schema.parse(undefined)).toBe(42);
        });
      });
    });
  });

  describe('Boolean Options', () => {
    const DryRunArgs = {
      name: 'dryRun',
      flags: '-d, --dry-run',
      type: 'boolean',
      description:
        'Dry run the command, preview any changes that would be made',
      default: true,
    } as const;

    describe('type checking', () => {
      test("does not allow 'optional' parameter", () => {
        // @ts-expect-error - boolean options do not support optional
        CreateCliOption({ ...DryRunArgs, optional: true });
      });

      test("allows 'silent' parameter when given a default value", () => {
        CreateCliOption({ ...DryRunArgs, silent: true });
      });

      test("does not allow 'silent' parameter when not given a default value", () => {
        // @ts-expect-error - silent only allowed when default is set (boolean has no optional)
        CreateCliOption({
          name: 'dryRun',
          flags: '-d, --dry-run',
          type: 'boolean',
          description: 'Dry run',
          silent: true,
        });
      });
    });

    describe('functionality', () => {
      test('preserves the given option name', () => {
        const DryRun = CreateCliOption(DryRunArgs);
        const name = DryRun.name;
        expect(name).toBe('dryRun');
        expectTypeOf(name).toEqualTypeOf<'dryRun'>();
      });

      test('throws an OptionNameMismatchError if the given name does not match the name from the generated Commander option', () => {
        expect(() => {
          CreateCliOption({
            ...DryRunArgs,
            name: 'foo',
          });
        }).toThrow(OptionNameMismatchError);

        expect(() => {
          CreateCliOption({
            ...DryRunArgs,
            flags: '--dry-run-foo',
          });
        }).toThrow(OptionNameMismatchError);
      });

      test("parses 'true' as true and 'false' as false", () => {
        const DryRun = CreateCliOption(DryRunArgs);
        expectTypeOf(DryRun.schema.parse).returns.toEqualTypeOf<boolean>();
        expect(DryRun.schema.parse('true')).toBe(true);
        expect(DryRun.schema.parse('false')).toBe(false);
      });

      test("parses '1' as true and '0' as false", () => {
        const DryRun = CreateCliOption(DryRunArgs);
        expectTypeOf(DryRun.schema.parse).returns.toEqualTypeOf<boolean>();
        expect(DryRun.schema.parse('1')).toBe(true);
        expect(DryRun.schema.parse('0')).toBe(false);
      });

      test('uses the given default value for parsing when no value is provided', () => {
        const option = CreateCliOption(DryRunArgs);
        expect(option.schema.parse(undefined)).toBe(true);
      });

      test('generates a registration object with the option name as the key and the schema as the value', () => {
        const option = CreateCliOption(DryRunArgs);
        const reg = option.getRegistrationObject();
        expect(reg).toHaveProperty('dryRun');
        // Schema is built dynamically; assert it behaves the same (functional equivalence).
        expect(reg.dryRun.parse(undefined)).toEqual(
          option.schema.parse(undefined)
        );
        expect(reg.dryRun.parse('true')).toEqual(option.schema.parse('true'));
      });

      test('parses a value of undefined as false when no default value is provided', () => {
        const option = CreateCliOption({
          name: 'dryRun',
          flags: '-d, --dry-run',
          type: 'boolean',
          description: 'Dry run',
        });
        expect(option.schema.parse(undefined)).toBe(false);
      });

      test('parses a value of an empty string as false when no default value is provided', () => {
        const option = CreateCliOption({
          name: 'dryRun',
          flags: '-d, --dry-run',
          type: 'boolean',
          description: 'Dry run',
        });
        expect(option.schema.parse('')).toBe(false);
      });
    });

    describe('method chaining', () => {
      describe('optional', () => {
        test('does not exist on boolean options', () => {
          const DryRun = CreateCliOption(DryRunArgs);
          expectTypeOf(DryRun).not.toHaveProperty('optional');
        });
      });
    });

    describe('silent', () => {
      test('returns a new instance', () => {
        const DryRun = CreateCliOption(DryRunArgs);
        const silentOption = DryRun.silent();
        expect(silentOption).not.toBe(DryRun);
        expect(silentOption.name).toBe('dryRun');
      });
      test('new instance silent property is set to true', () => {
        const DryRun = CreateCliOption(DryRunArgs);
        const silentOption = DryRun.silent() as any;
        expect(silentOption[$BrandSymbol]._def.silent).toBe(true);
      });
    });

    describe('default', () => {
      test('returns a new instance', () => {
        const DryRun = CreateCliOption({
          name: 'dryRun',
          flags: '-d, --dry-run',
          type: 'boolean',
          description: 'Dry run',
        });
        const WithDefault = DryRun.default(true);
        expect(WithDefault).not.toBe(DryRun);
        expect(WithDefault.name).toBe('dryRun');
      });

      test('new instance parses undefined as the default value', () => {
        const DryRun = CreateCliOption({
          name: 'dryRun',
          flags: '-d, --dry-run',
          type: 'boolean',
          description: 'Dry run',
        });
        const WithDefault = DryRun.default(true);
        expect(WithDefault.schema.parse(undefined)).toBe(true);
      });
    });
  });

  describe('Select Options', () => {
    const EnvironmentArgs = {
      name: 'env',
      flags: '-e, --env [environment]',
      type: 'select',
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
    } as const;

    describe('type checking', () => {
      test('allows creating a select option (schema output constraint not enforced at type level for overload resolution)', () => {
        // SelectOptionCreatorArgs does not use NonUndefinedOutput so overload resolution works.
        const optionalStringSchema = z.string().optional();
        const selectArgsWithOptionalSchema = {
          name: 'env',
          flags: '--env [env]',
          type: 'select',
          description: 'Environment',
          schema: optionalStringSchema,
          default: 'stage',
          inquiry: 'Select the environment to use',
          choices: [
            { name: 'stage', value: 'stage' },
            { name: 'prod', value: 'prod' },
          ],
        } as const;

        const option = CreateCliOption(selectArgsWithOptionalSchema);
        expect(option.name).toBe('env');
      });

      test("allows 'optional' parameter when not given a default value", () => {
        CreateCliOption({
          ...EnvironmentArgs,
          default: undefined,
          optional: true,
        });
      });

      test("does not allow 'optional' parameter when given a default value", () => {
        // @ts-expect-error - optional and default are mutually exclusive
        CreateCliOption({ ...EnvironmentArgs, optional: true });
      });

      test("allows 'silent' parameter when given a default value", () => {
        CreateCliOption({
          ...EnvironmentArgs,
          silent: true,
        });
      });

      test("allows 'silent' parameter when optional parameter is set to true", () => {
        const { default: _default, ...argsWithoutDefault } = EnvironmentArgs;
        CreateCliOption({
          ...argsWithoutDefault,
          optional: true,
          silent: true,
        });
      });

      test("does not allow 'silent' parameter when not given a default value and optional parameter is set to false", () => {
        const { default: _default, ...argsWithoutDefault } = EnvironmentArgs;
        // @ts-expect-error - silent only allowed when default or optional: true
        CreateCliOption({
          ...argsWithoutDefault,
          default: undefined,
          optional: false,
          silent: true,
        });
      });
      test("does not allow 'silent' parameter when not given a default value and optional parameter not set", () => {
        const { default: _default, ...argsWithoutDefault } = EnvironmentArgs;
        // @ts-expect-error - silent only allowed when default or optional: true
        CreateCliOption({
          ...argsWithoutDefault,
          default: undefined,
          silent: true,
        });
      });
    });

    describe('functionality', () => {
      test('preserves the given option name', () => {
        const Environment = CreateCliOption(EnvironmentArgs);
        const name = Environment.name;
        expect(name).toBe('env');
        expectTypeOf(name).toEqualTypeOf<'env'>();
      });

      test('throws an OptionNameMismatchError if the given name does not match the name from the generated Commander option', () => {
        expect(() => {
          CreateCliOption({
            ...EnvironmentArgs,
            name: 'foo',
          });
        }).toThrow(OptionNameMismatchError);

        expect(() => {
          CreateCliOption({
            ...EnvironmentArgs,
            flags: '--env-foo [environmentFoo]',
          });
        }).toThrow(OptionNameMismatchError);
      });

      test('preserves the given schema to use for parsing', () => {
        const Environment = CreateCliOption(EnvironmentArgs);
        expectTypeOf(Environment.schema.parse).returns.toEqualTypeOf<
          'stage' | 'prod'
        >();
        expect(Environment.schema.parse('stage')).toBe('stage');
      });

      test('uses the given default value for parsing when no value is provided', () => {
        const option = CreateCliOption(EnvironmentArgs);
        expect(option.schema.parse(undefined)).toBe('stage');
      });

      test('generates a registration object with the option name as the key and the schema as the value', () => {
        const option = CreateCliOption(EnvironmentArgs);
        const reg = option.getRegistrationObject();
        expect(reg).toHaveProperty('env');
        // Schema is built dynamically; assert it behaves the same (functional equivalence).
        expect(reg.env.parse(undefined)).toEqual(
          option.schema.parse(undefined)
        );
        expect(reg.env.parse('stage')).toEqual(option.schema.parse('stage'));
      });

      test('safely parses a value of undefined when optional parameter is set to true', () => {
        const option = CreateCliOption({
          ...EnvironmentArgs,
          default: undefined,
          optional: true,
        });
        expect(option.schema.parse(undefined)).toBe(undefined);
      });

      test('fails to parse a value of undefined when optional parameter is set to false', () => {
        const { default: _default, ...argsWithoutDefault } = EnvironmentArgs;
        const option = CreateCliOption({
          ...argsWithoutDefault,
          optional: false,
        });
        expect(() => option.schema.parse(undefined)).toThrow();
      });

      test('fails to parse a value of undefined when optional parameter is not set', () => {
        const { default: _default, ...argsWithoutDefault } = EnvironmentArgs;
        const option = CreateCliOption(argsWithoutDefault);
        expect(() => option.schema.parse(undefined)).toThrow();
      });

      test('safely parses a value of an empty string as undefined when optional parameter is set to true', () => {
        const option = CreateCliOption({
          ...EnvironmentArgs,
          default: undefined,
          optional: true,
        });
        expect(option.schema.parse('')).toBeUndefined();
      });

      test('fails to parse a value of an empty string when optional parameter is set to false', () => {
        const option = CreateCliOption({
          ...EnvironmentArgs,
          default: undefined,
          optional: false,
        });
        expect(() => option.schema.parse('')).toThrow();
      });

      test('fails to parse a value of an empty string when optional parameter is not set', () => {
        const { default: _default, ...argsWithoutDefault } = EnvironmentArgs;
        const option = CreateCliOption(argsWithoutDefault);

        expect(() => option.schema.parse('')).toThrow();
      });
    });

    describe('method chaining', () => {
      describe('optional', () => {
        test('returns a new instance', () => {
          const Environment = CreateCliOption(EnvironmentArgs);
          const SecondEnv = Environment.optional();
          expect(SecondEnv).not.toBe(Environment);
          expect(SecondEnv.name).toBe('env');
        });
        test('new instance successfully parses undefined and returns original default value when provided', () => {
          const option = CreateCliOption(EnvironmentArgs);
          const optionalOption = option.optional();
          expect(optionalOption.schema.parse(undefined)).toBe('stage');
        });
        test('new instance successfully parses a value of an empty string and returns original default value when provided', () => {
          const option = CreateCliOption({
            ...EnvironmentArgs,
            schema: z.string().pipe(z.enum(['prod', 'stage'])),
            default: 'stage',
          });
          const optionalOption = option.optional();
          expect(optionalOption.schema.parse('')).toBe('stage');
        });
        test('new instance successfully parses undefined and returns undefined when no default value was originally provided', () => {
          const { default: _default, ...argsWithoutDefault } = EnvironmentArgs;
          const option = CreateCliOption(argsWithoutDefault);
          const optionalOption = option.optional();
          expect(optionalOption.schema.parse(undefined)).toBeUndefined();
        });
        test('new instance successfully parses a value of an empty string and returns undefined when no default value was originally provided', () => {
          const { default: _default, ...argsWithoutDefault } = EnvironmentArgs;
          const option = CreateCliOption({
            ...argsWithoutDefault,
            schema: z.string().pipe(z.enum(['prod', 'stage'])),
          });
          const optionalOption = option.optional();
          expect(optionalOption.schema.parse('')).toBeUndefined();
        });
      });

      describe('silent', () => {
        test('returns a new instance', () => {
          const option = CreateCliOption(EnvironmentArgs);
          const silentOption = option.silent();
          expect(silentOption).not.toBe(option);
          expect(silentOption.name).toBe('env');
        });
        test('new instance silent property is set to true', () => {
          const option = CreateCliOption(EnvironmentArgs);
          const silentOption = option.silent() as any;

          expect(silentOption[$BrandSymbol]._def.silent).toBe(true);
        });
      });

      describe('default', () => {
        test('returns a new instance', () => {
          const { default: _default, ...argsWithoutDefault } = EnvironmentArgs;
          const option = CreateCliOption(argsWithoutDefault);
          const WithDefault = option.default('stage');
          expect(WithDefault).not.toBe(option);
          expect(WithDefault.name).toBe('env');
        });

        test('new instance parses undefined as the default value', () => {
          const { default: _default, ...argsWithoutDefault } = EnvironmentArgs;
          const option = CreateCliOption(argsWithoutDefault);
          const WithDefault = option.default('stage');
          expect(WithDefault.schema.parse(undefined)).toBe('stage');
        });
      });
    });
  });
});
