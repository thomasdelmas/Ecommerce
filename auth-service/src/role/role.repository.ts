import type { IRoleModel } from '../types/db.types.js';
import type { IRoleRepository } from './role.types.js';

export class RoleRepository implements IRoleRepository {
  constructor(private db: IRoleModel) {}

  getRole = async (role: string) => {
    return this.db.findOne({ role });
  };
}
