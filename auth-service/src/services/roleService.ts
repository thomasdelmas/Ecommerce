import { IRoleRepository } from '../repositories/roleRepository';

export type IRoleService = {
  getPermissionsForRole: (name: string) => Promise<string[] | null>;
};

export class RoleService implements IRoleService {
  constructor(private roleRepository: IRoleRepository) {}

  getPermissionsForRole = async (name: string) => {
    try {
      const role = await this.roleRepository.getRole(name);

      return role ? role.permissions : [];
    } catch (err) {
      console.error('Error in getRole:', err);
      return null;
    }
  };
}
