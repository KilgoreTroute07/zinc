import { OptionType } from '../option-creator';

export const Logged: unique symbol = Symbol('Logged');

export class ZincError extends Error {
  [Logged]: boolean;

  constructor(message: string) {
    super(message);
    this.name = 'ZincError';
    this[Logged] = false;
  }
}

/**
 * Error thrown when the given name of an option does not match the name from the generated
 * Commander option. i.e. If you pass a name of "user", but give commander a flag or "--user-id",
 * this error will be thrown. As the commander option will generate `userId` instead of `user`.
 */
export class OptionNameMismatchError extends ZincError {
  constructor(givenName: string, nameFromOption: string) {
    super(
      `Given name "${givenName}" does not match the name from the generated Commander option "${nameFromOption}"`
    );
    this.name = 'OptionNameMismatchError';
  }
}

/**
 * Error thrown when a choice value is invalid for a select option. i.e. If you pass a choice value of 1,
 * but the select option has choices of ["1", "2", "3"], this error will be thrown.
 */
export class SelectChoiceInvalidError extends ZincError {
  constructor(choiceValue: string, optionName: string) {
    super(
      `Select choice value "${choiceValue}" is invalid for option "${optionName}"`
    );
    this.name = 'SelectChoiceInvalidError';
  }
}

/**
 * Error thrown when a user tries to generate an option with an unknown type.  It is prevented at
 * the typescript level, but this error is thrown at runtime if the user passes an invalid type.
 */
export class InvalidOptionTypeError<
  TObj extends { type: OptionType },
> extends ZincError {
  constructor(args: TObj) {
    super(`Invalid option type: ${args.type}`);
    this.name = 'InvalidOptionTypeError';
  }
}
