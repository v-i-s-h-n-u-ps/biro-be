import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5433,
    username: process.env.DB_USERNAME || 'nestuser',
    password: process.env.DB_PASSWORD || 'nestpass',
    database: process.env.DB_NAME || 'biro_db',
    entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
    migrations: [path.join(__dirname, '/../database/migrations/*{.ts,.js}')],
    synchronize: false,
  }),
);
