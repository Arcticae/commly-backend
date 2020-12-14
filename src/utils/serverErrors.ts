/* eslint-disable import/prefer-default-export */
/* eslint-disable max-classes-per-file */

export class ServerConfigurationError extends Error {
  constructor(message: string) {
    super(`Server configuration error: ${message}`);
  }
}

export class FatalError extends Error {
  constructor(message: string) {
    super(`Unexpected error: ${message}`);
  }
}
