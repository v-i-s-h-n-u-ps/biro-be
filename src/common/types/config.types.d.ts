import 'nestjs/config';

export interface ConfigProperties {
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_PROJECT_ID: string;
}

declare module '@nestjs/config' {
  // augment ConfigService with your type
  interface ConfigService<T = ConfigProperties> {
    get<K extends keyof T>(propertyPath: K): T[K];
  }
}
