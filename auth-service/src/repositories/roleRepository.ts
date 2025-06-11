import { HydratedDocument } from 'mongoose';
import { IRole } from '../types/role';
import { IRoleModel } from '../types/db';

export type IRoleRepository = {
  getRole: (role: string) => Promise<HydratedDocument<IRole> | null>;
};

export class RoleRepository implements IRoleRepository {
  constructor(private db: IRoleModel) {}

  getRole = async (role: string) => {
    return this.db.findOne({ role });
  };
}
