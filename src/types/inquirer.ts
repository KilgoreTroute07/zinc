import { confirm, input, select } from '@inquirer/prompts';

export type InquirerInputConfig = Parameters<typeof input>[0];
export type InquirerSelectConfig = Parameters<typeof select<string>>[0];
export type InquirerConfirmConfig = Parameters<typeof confirm>[0];

export type InquirerConfig =
  | InquirerInputConfig
  | InquirerSelectConfig
  | InquirerConfirmConfig;
