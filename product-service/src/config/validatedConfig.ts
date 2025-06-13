import rawConfig from './rawConfig.js';
import { IConfig } from '../types/config.js';

function assertConfig(c: IConfig): asserts c is Required<IConfig> {
  if (!c.mongoURI) throw new Error('mongoURI is undefined');
  if (!c.port) throw new Error('port is undefined');
  if (!c.dbName) throw new Error('dbName is undefined');
  if (!c.privateKey) throw new Error('privateKey is undefined');
}

assertConfig(rawConfig);

export default rawConfig as Required<IConfig>;
