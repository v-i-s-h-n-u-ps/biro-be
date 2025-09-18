import databaseConfig from 'config/database.config';
import { DataSource, DataSourceOptions } from 'typeorm';

const options = databaseConfig() as DataSourceOptions; // cast to DataSourceOptions
export const dataSource = new DataSource(options);
