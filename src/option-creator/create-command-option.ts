import { Option } from 'commander';
import { OptionNameMismatchError } from '../errors';

export function createCommandOption<Name extends string>(args: {
  name: Name;
  flags: string;
  description: string;
}): Option {
  const { name, flags, description } = args;
  const commandOption = new Option(flags, description);
  const nameFromOption = commandOption.attributeName();
  if (nameFromOption !== name) {
    throw new OptionNameMismatchError(name, nameFromOption);
  }
  return commandOption;
}
