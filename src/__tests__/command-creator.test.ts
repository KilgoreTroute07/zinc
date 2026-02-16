/**
 * Tests for command-creator. Uses real HnCliOptions (via CreateCliOption) and
 * mocks @inquirer/prompts to control values when options are prompted.
 */
import { Command } from 'commander';
import { beforeEach, describe, expect, expectTypeOf, test, vi } from 'vitest';
import { z } from 'zod';
import createCommand from '../command-creator';
import { CreateCliOption } from '../option-creator';

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn().mockResolvedValue('mocked-input'),
  confirm: vi.fn().mockResolvedValue(true),
  select: vi.fn().mockResolvedValue('stage'),
}));

describe('createCommand', () => {
  beforeEach(async () => {
    const { input, confirm, select } = await import('@inquirer/prompts');
    vi.mocked(input).mockClear();
    vi.mocked(confirm).mockClear();
    vi.mocked(select).mockClear();
  });

  test('parses CLI options and uses inquirer for missing options, then calls action with parsed options', async () => {
    expect.hasAssertions();

    const EnvOption = CreateCliOption({
      name: 'env',
      flags: '-e, --env [env]',
      type: 'input',
      description: 'Environment',
      schema: z.enum(['prod', 'stage']),
    });

    const DryRunOption = CreateCliOption({
      name: 'dryRun',
      flags: '-d, --dry-run',
      type: 'boolean',
      description: 'Dry run',
      default: false,
    });

    const action = vi.fn().mockResolvedValue(undefined);

    const testCommand = createCommand({
      name: 'test-command',
      description: 'Test command',
      options: [EnvOption, DryRunOption],
      action,
    });

    const parentCommand = new Command()
      .name('parent-command')
      .addCommand(testCommand);

    // Pass --env on CLI; omit --dry-run so inquirer (confirm) is used for dryRun.
    await parentCommand.parseAsync([
      'node',
      'script.js',
      'test-command',
      '--env',
      'prod',
    ]);

    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith({
      env: 'prod',
      dryRun: true, // from mocked confirm()
    });
  });

  test('calls action with only CLI-provided values when all options are passed on the command line', async () => {
    expect.hasAssertions();

    const EnvOption = CreateCliOption({
      name: 'env',
      flags: '-e, --env [env]',
      type: 'input',
      description: 'Environment',
      schema: z.enum(['prod', 'stage']),
    });

    const DryRunOption = CreateCliOption({
      name: 'dryRun',
      flags: '-d, --dry-run',
      type: 'boolean',
      description: 'Dry run',
      default: false,
    });

    const action = vi.fn().mockResolvedValue(undefined);

    const testCommand = createCommand({
      name: 'test-command',
      description: 'Test command',
      options: [EnvOption, DryRunOption],
      action,
    });

    const parentCommand = new Command()
      .name('parent-command')
      .addCommand(testCommand);

    await parentCommand.parseAsync([
      'node',
      'script.js',
      'test-command',
      '--env',
      'stage',
      '--dry-run',
    ]);

    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith({
      env: 'stage',
      dryRun: true,
    });

    const { input, confirm, select } = await import('@inquirer/prompts');
    expect(input).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });

  test('calls inquirer for every option when no options are passed on the command line', async () => {
    expect.hasAssertions();

    const { input } = await import('@inquirer/prompts');
    vi.mocked(input).mockResolvedValueOnce('stage'); // must match schema z.enum(["prod", "stage"])

    const EnvOption = CreateCliOption({
      name: 'env',
      flags: '-e, --env [env]',
      type: 'input',
      description: 'Environment',
      schema: z.enum(['prod', 'stage']),
    });

    const DryRunOption = CreateCliOption({
      name: 'dryRun',
      flags: '-d, --dry-run',
      type: 'boolean',
      description: 'Dry run',
      default: false,
    });

    const action = vi.fn().mockResolvedValue(undefined);

    const testCommand = createCommand({
      name: 'test-command',
      description: 'Test command',
      options: [EnvOption, DryRunOption],
      action,
    });

    const parentCommand = new Command()
      .name('parent-command')
      .addCommand(testCommand);

    await parentCommand.parseAsync(['node', 'script.js', 'test-command']);

    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith({
      env: 'stage', // from mocked input()
      dryRun: true, // from mocked confirm()
    });
  });

  test('parses and coerces option values according to each option schema (e.g. number, boolean)', async () => {
    expect.hasAssertions();

    const CountOption = CreateCliOption({
      name: 'count',
      flags: '-c, --count <count>',
      type: 'input',
      description: 'Count',
      schema: z.coerce.number(),
    });

    const DryRunOption = CreateCliOption({
      name: 'dryRun',
      flags: '-d, --dry-run',
      type: 'boolean',
      description: 'Dry run',
      default: false,
    });

    const action = vi.fn().mockResolvedValue(undefined);

    const testCommand = createCommand({
      name: 'test-command',
      description: 'Test command',
      options: [CountOption, DryRunOption],
      action,
    });

    const parentCommand = new Command()
      .name('parent-command')
      .addCommand(testCommand);

    await parentCommand.parseAsync([
      'node',
      'script.js',
      'test-command',
      '--count',
      '42',
      '--dry-run',
    ]);

    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith({
      count: 42,
      dryRun: true,
    });
  });

  test('throws or propagates when inquirer mock rejects (simulated user cancellation)', async () => {
    expect.hasAssertions();

    const { confirm } = await import('@inquirer/prompts');
    const confirmMock = vi.mocked(confirm);
    confirmMock.mockRejectedValueOnce(new Error('User cancelled'));

    const DryRunOption = CreateCliOption({
      name: 'dryRun',
      flags: '-d, --dry-run',
      type: 'boolean',
      description: 'Dry run',
      default: false,
    });

    const action = vi.fn().mockResolvedValue(undefined);

    const testCommand = createCommand({
      name: 'test-command',
      description: 'Test command',
      options: [DryRunOption],
      action,
    });

    const parentCommand = new Command()
      .name('parent-command')
      .addCommand(testCommand);

    await expect(
      parentCommand.parseAsync(['node', 'script.js', 'test-command'])
    ).rejects.toThrow('User cancelled');

    expect(action).not.toHaveBeenCalled();

    confirmMock.mockResolvedValue(true);
  });

  test('passes parsed options that satisfy the combined schema type (type-level and runtime)', async () => {
    expect.hasAssertions();

    const EnvOption = CreateCliOption({
      name: 'env',
      flags: '-e, --env [env]',
      type: 'input',
      description: 'Environment',
      schema: z.enum(['prod', 'stage']),
    });

    const DryRunOption = CreateCliOption({
      name: 'dryRun',
      flags: '-d, --dry-run',
      type: 'boolean',
      description: 'Dry run',
      default: false,
    });

    let capturedOptions: { env: 'prod' | 'stage'; dryRun: boolean } | undefined;

    const testCommand = createCommand({
      name: 'test-command',
      description: 'Test command',
      options: [EnvOption, DryRunOption],
      action: (parsedOptions) => {
        capturedOptions = parsedOptions;
      },
    });

    const parentCommand = new Command()
      .name('parent-command')
      .addCommand(testCommand);

    await parentCommand.parseAsync([
      'node',
      'script.js',
      'test-command',
      '--env',
      'prod',
    ]);

    expect(capturedOptions).toBeDefined();
    expect(capturedOptions).toEqual({ env: 'prod', dryRun: true });

    expectTypeOf(capturedOptions!).toEqualTypeOf<{
      env: 'prod' | 'stage';
      dryRun: boolean;
    }>();
  });

  test('Fails and does not call the given action when given an invalid option from the command line', async () => {
    expect.hasAssertions();

    const EnvOption = CreateCliOption({
      name: 'env',
      flags: '-e, --env [env]',
      type: 'input',
      description: 'Environment',
      schema: z.enum(['prod', 'stage']),
    });

    const DryRunOption = CreateCliOption({
      name: 'dryRun',
      flags: '-d, --dry-run',
      type: 'boolean',
      description: 'Dry run',
      default: false,
    });

    const action = vi.fn().mockResolvedValue(undefined);

    const testCommand = createCommand({
      name: 'test-command',
      description: 'Test command',
      options: [EnvOption, DryRunOption],
      action,
    });

    const parentCommand = new Command()
      .name('parent-command')
      .addCommand(testCommand);

    await expect(
      parentCommand.parseAsync([
        'node',
        'script.js',
        'test-command',
        '--env',
        'invalid',
      ])
    ).rejects.toThrow();

    expect(action).not.toHaveBeenCalled();
  });

  test('Fails and does not call the given action when given an invalid option from inquirer', async () => {
    expect.hasAssertions();

    const { input } = await import('@inquirer/prompts');
    vi.mocked(input).mockResolvedValueOnce('invalid'); // does not match z.enum(["prod", "stage"])

    const EnvOption = CreateCliOption({
      name: 'env',
      flags: '-e, --env [env]',
      type: 'input',
      description: 'Environment',
      schema: z.enum(['prod', 'stage']),
    });

    const DryRunOption = CreateCliOption({
      name: 'dryRun',
      flags: '-d, --dry-run',
      type: 'boolean',
      description: 'Dry run',
      default: false,
    });

    const action = vi.fn().mockResolvedValue(undefined);

    const testCommand = createCommand({
      name: 'test-command',
      description: 'Test command',
      options: [EnvOption, DryRunOption],
      action,
    });

    const parentCommand = new Command()
      .name('parent-command')
      .addCommand(testCommand);

    await expect(
      parentCommand.parseAsync(['node', 'script.js', 'test-command'])
    ).rejects.toThrow();

    expect(action).not.toHaveBeenCalled();
  });

  describe('Silent Options', () => {
    test('does not show inquiry when the option is not provided', async () => {
      expect.hasAssertions();

      const { input } = await import('@inquirer/prompts');
      // If silent were implemented we would not call input; mock so parse succeeds and we can assert input was not called
      vi.mocked(input).mockResolvedValueOnce('stage');

      const EnvOption = CreateCliOption({
        name: 'env',
        flags: '-e, --env [env]',
        type: 'input',
        description: 'Environment',
        schema: z.enum(['prod', 'stage']),
        default: 'stage',
        silent: true,
      });

      const action = vi.fn().mockResolvedValue(undefined);

      const testCommand = createCommand({
        name: 'test-command',
        description: 'Test command',
        options: [EnvOption],
        action,
      });

      const parentCommand = new Command()
        .name('parent-command')
        .addCommand(testCommand);

      await parentCommand.parseAsync(['node', 'script.js', 'test-command']);

      expect(action).toHaveBeenCalledWith({ env: 'stage' });
      // Silent option should skip inquirer and use default; currently inquirer is still called
      expect(input).not.toHaveBeenCalled();
    });

    test('passes the default value to the action when the option is not provided', async () => {
      expect.hasAssertions();

      const EnvOption = CreateCliOption({
        name: 'env',
        flags: '-e, --env [env]',
        type: 'input',
        description: 'Environment',
        schema: z.enum(['prod', 'stage']),
        default: 'stage',
        silent: true,
      });

      const action = vi.fn().mockResolvedValue(undefined);

      const testCommand = createCommand({
        name: 'test-command',
        description: 'Test command',
        options: [EnvOption],
        action,
      });

      const parentCommand = new Command()
        .name('parent-command')
        .addCommand(testCommand);

      await parentCommand.parseAsync(['node', 'script.js', 'test-command']);

      expect(action).toHaveBeenCalledWith({ env: 'stage' });
    });

    test('passes undefined to the action when the option is not provided and the CLI option is marked as optional', async () => {
      expect.hasAssertions();

      const EnvOption = CreateCliOption({
        name: 'env',
        flags: '-e, --env [env]',
        type: 'input',
        description: 'Environment',
        schema: z.enum(['prod', 'stage']),
        optional: true,
        silent: true,
      });

      const action = vi.fn().mockResolvedValue(undefined);

      const testCommand = createCommand({
        name: 'test-command',
        description: 'Test command',
        options: [EnvOption],
        action,
      });

      const parentCommand = new Command()
        .name('parent-command')
        .addCommand(testCommand);

      await parentCommand.parseAsync(['node', 'script.js', 'test-command']);

      expect(action).toHaveBeenCalledWith({ env: undefined });
    });
  });
});
