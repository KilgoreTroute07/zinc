import { Command } from 'commander';
import {
  BuildEnvironmentSchemaFromOptions,
  ZincOptionArray,
  type ParsedOptions,
} from '../option-creator';

interface CommandCreatorArgs<Options extends ZincOptionArray> {
  name: string;
  description: string;
  options: Options;
  action: (parsedOptions: ParsedOptions<Options>) => void | Promise<void>;
}

export function createCommand<const Options extends ZincOptionArray>(
  args: CommandCreatorArgs<Options>
): Command {
  const { name, description, options } = args;
  const command = new Command(name).description(description);
  const finalOptionsSchema = BuildEnvironmentSchemaFromOptions(options);

  options.forEach((option) => {
    command.addOption(option.commandOption);
  });

  command.action(async function (this: Command) {
    const commanderGivenOptions = this.opts();
    const finalOptions = {} as Record<string, unknown>;

    for (const option of options) {
      const optionName = option.name;

      finalOptions[optionName] =
        commanderGivenOptions[optionName] ?? (await option.inquire());
    }

    const parsedOptions = finalOptionsSchema.parse(finalOptions);

    await args.action(parsedOptions);
  });

  return command;
}

export default createCommand;
