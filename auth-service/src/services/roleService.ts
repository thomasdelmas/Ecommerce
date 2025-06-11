import { IRoleRepository } from "../repositories/roleRepository";
import { IRoleModel } from "../types/db";

export type IRoleService = {
	getPermissionsForRole: (name: string, db: IRoleModel) => Promise<string[] | null>
}

export class RoleService implements IRoleService {
  constructor(private roleRepository: IRoleRepository) {}

	getPermissionsForRole = async (name: string, db: IRoleModel) => {
		try {
			const role = await this.roleRepository.getRole(name, db)

			return role ? role.permissions : []
		} catch (err) {
      console.error('Error in getRole:', err);
      return null;
    }
	};
}
