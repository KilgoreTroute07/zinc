/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, expectTypeOf, test } from 'vitest';
import { OptionNameMismatchError } from '../../../errors';
import { $BrandSymbol } from '../../zinc-option';
import { BooleanCliOption } from '../boolean';

describe('Boolean Options', () => {
  describe('type checking', () => {
    test("does not allow 'optional' parameter", () => {
      BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description:
          'Dry run the command, preview any changes that would be made',
        default: true,
        // @ts-expect-error - boolean options do not support optional
        optional: true,
      });
    });

    test("allows 'silent' parameter when given a default value", () => {
      BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description:
          'Dry run the command, preview any changes that would be made',
        default: true,
        silent: true,
      });
    });

    test("does not allow 'silent' parameter when not given a default value", () => {
      // @ts-expect-error - silent only allowed when default is set (boolean has no optional)
      BooleanCliOption({
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
      const option = BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description:
          'Dry run the command, preview any changes that would be made',
        default: true,
      });
      const name = option.name;
      expect(name).toBe('dryRun');
      expectTypeOf(name).toEqualTypeOf<'dryRun'>();
    });

    test('throws an OptionNameMismatchError if the given name does not match the name from the generated Commander option', () => {
      expect(() => {
        BooleanCliOption({
          name: 'foo',
          flags: '-d, --dry-run',
          type: 'boolean',
          description:
            'Dry run the command, preview any changes that would be made',
          default: true,
        });
      }).toThrow(OptionNameMismatchError);

      expect(() => {
        BooleanCliOption({
          name: 'dryRun',
          flags: '--dry-run-foo',
          type: 'boolean',
          description:
            'Dry run the command, preview any changes that would be made',
          default: true,
        });
      }).toThrow(OptionNameMismatchError);
    });

    test("parses 'true' as true and 'false' as false", () => {
      const option = BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description:
          'Dry run the command, preview any changes that would be made',
        default: true,
      });
      expectTypeOf(option.schema.parse).returns.toEqualTypeOf<boolean>();
      expect(option.schema.parse('true')).toBe(true);
      expect(option.schema.parse('false')).toBe(false);
    });

    test("parses '1' as true and '0' as false", () => {
      const option = BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description:
          'Dry run the command, preview any changes that would be made',
        default: true,
      });
      expectTypeOf(option.schema.parse).returns.toEqualTypeOf<boolean>();
      expect(option.schema.parse('1')).toBe(true);
      expect(option.schema.parse('0')).toBe(false);
    });

    test('uses the given default value for parsing when no value is provided', () => {
      const option = BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description:
          'Dry run the command, preview any changes that would be made',
        default: true,
      });
      expect(option.schema.parse(undefined)).toBe(true);
    });

    test('generates a registration object with the option name as the key and the schema as the value', () => {
      const option = BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description:
          'Dry run the command, preview any changes that would be made',
        default: true,
      });
      const reg = option.getRegistrationObject();
      expect(reg).toHaveProperty('dryRun');
      // Schema is built dynamically; assert it behaves the same (functional equivalence).
      expect(reg.dryRun.parse(undefined)).toEqual(
        option.schema.parse(undefined)
      );
      expect(reg.dryRun.parse('true')).toEqual(option.schema.parse('true'));
    });

    test('parses a value of undefined as false when no default value is provided', () => {
      const option = BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description: 'Dry run',
      });
      expect(option.schema.parse(undefined)).toBe(false);
    });

    test('parses a value of an empty string as false when no default value is provided', () => {
      const option = BooleanCliOption({
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
        const option = BooleanCliOption({
          name: 'dryRun',
          flags: '-d, --dry-run',
          type: 'boolean',
          description:
            'Dry run the command, preview any changes that would be made',
          default: true,
        });
        expectTypeOf(option).not.toHaveProperty('optional');
      });
    });
  });

  describe('silent', () => {
    test('returns a new instance', () => {
      const option = BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description:
          'Dry run the command, preview any changes that would be made',
        default: true,
      });
      const silentOption = option.silent();
      expect(silentOption).not.toBe(option);
      expect(silentOption.name).toBe('dryRun');
    });
    test('new instance silent property is set to true', () => {
      const option = BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description:
          'Dry run the command, preview any changes that would be made',
        default: true,
      });
      const silentOption = option.silent() as any;
      expect(silentOption[$BrandSymbol]._def.silent).toBe(true);
    });
  });

  describe('default', () => {
    test('returns a new instance', () => {
      const option = BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description: 'Dry run',
      });
      const WithDefault = option.default(true);
      expect(WithDefault).not.toBe(option);
      expect(WithDefault.name).toBe('dryRun');
    });

    test('new instance parses undefined as the default value', () => {
      const option = BooleanCliOption({
        name: 'dryRun',
        flags: '-d, --dry-run',
        type: 'boolean',
        description: 'Dry run',
      });
      const WithDefault = option.default(true);
      expect(WithDefault.schema.parse(undefined)).toBe(true);
    });
  });
});
