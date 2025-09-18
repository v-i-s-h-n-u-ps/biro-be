import * as Joi from 'joi';

export interface ConfigProperties {
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_PROJECT_ID: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_DB_INDEX: number;
  NODE_ENV?: 'development' | 'production';
  MODE: 'development' | 'production';
}

export const validationSchema = Joi.object<ConfigProperties>({
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5433),
  DB_USERNAME: Joi.string().default('nestuser'),
  DB_PASSWORD: Joi.string().allow('').optional().default('nestpass'),
  DB_NAME: Joi.string().default('biro_db'),
  FIREBASE_CLIENT_EMAIL: Joi.string().required().default(''),
  FIREBASE_PRIVATE_KEY: Joi.string().required().default(''),
  FIREBASE_PROJECT_ID: Joi.string().required().default(''),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6380),
  REDIS_DB_INDEX: Joi.number().default(0),
  NODE_ENV: Joi.allow(null)
    .optional()
    .valid('development', 'production')
    .default(null),
  MODE: Joi.string().valid('development', 'production').default('development'),
});
