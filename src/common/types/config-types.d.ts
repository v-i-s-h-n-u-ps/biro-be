import { ConfigProperties } from 'config/types';

import '@nestjs/config';

declare module '@nestjs/config' {
  // augment ConfigService with your type
  interface ConfigService<T = ConfigProperties> {
    get<K extends keyof T>(propertyPath: K): T[K];
  }
}
