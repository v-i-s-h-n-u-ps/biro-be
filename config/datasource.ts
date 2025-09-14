import { DataSource, DataSourceOptions } from 'typeorm';
import databaseConfig from './database.config';

const options = databaseConfig() as DataSourceOptions; // cast to DataSourceOptions
export const dataSource = new DataSource(options);
