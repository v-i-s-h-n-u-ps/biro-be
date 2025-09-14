import 'nestjs/config';

export interface ConfigProperties {
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}

declare module '@nestjs/config' {
  // augment ConfigService with your type
  interface ConfigService<T = ConfigProperties> {
    get<K extends keyof T>(propertyPath: K): T[K];
  }
}
