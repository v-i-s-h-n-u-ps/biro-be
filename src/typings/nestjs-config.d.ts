import { ConfigProperties } from 'config/types';

import '@nestjs/config';

declare module '@nestjs/config' {
  interface ConfigService<T = ConfigProperties> {
    // Required keys return the exact type (non-undefined)
    get<K extends keyof T>(propertyPath: K): T[K];
  }
}
