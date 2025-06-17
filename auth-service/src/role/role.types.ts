export type IRole = {
  role: string;
  permissions: string[];
};

export type IRoleService = {
  getPermissionsForRole: (name: string) => Promise<string[] | null>;
};

export type IRoleRepository = {
  getRole: (role: string) => Promise<IRole | null>;
};
