import type { IRoleRepository, IRoleService } from './role.types';

class RoleService implements IRoleService {
  constructor(private roleRepository: IRoleRepository) {}

  getPermissionsForRole = async (name: string) => {
    const role = await this.roleRepository.getRole(name);

    return role ? role.permissions : [];
  };
}

export default RoleService;
