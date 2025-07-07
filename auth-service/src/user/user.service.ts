import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config/validatedConfig.js';
import type { IProfile } from '../types/profile.types.js';
import type { IRoleService } from '../role/role.types.js';
import type { IUserRepository, IUserService } from './user.types.js';
import { Errors } from './user.error.js';

class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private roleService: IRoleService,
  ) {}

  register = async (username: string, password: string) => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUsers = await this.userRepository.createUsers([
      { username: username, hash: hashedPassword, role: 'user' },
    ]);

    return newUsers[0];
  };

  login = async (username: string, password: string) => {
    const user = await this.findUserByUsername(username);

    if (!user) {
      throw Errors.UserNotFound();
    }

    const isMatch = bcrypt.compareSync(password, user.hash);

    if (!isMatch) {
      throw Errors.InvalidPassword();
    }

    const permissions = await this.roleService.getPermissionsForRole(user.role);

    const token = jwt.sign(
      {
        id: user.id,
        permissions: permissions,
      },
      config.privateKey,
      { expiresIn: '15min' },
    );

    return token;
  };

  getProfile = async (id: string) => {
    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw Errors.UserNotFound();
    }

    const permissions = await this.roleService.getPermissionsForRole(user.role);

    const profile = {
      id: id,
      username: user.username,
      role: user.role,
      permissions: permissions,
    } as IProfile;

    return profile;
  };

  findUserByUsername = async (username: string) => {
    return await this.userRepository.getUserByUsername(username);
  };

  deleteUsers = async (userIds: string[]) => {
    const foundUsers = await this.userRepository.getUsersById(userIds);
    const foundUserIds = foundUsers.map((user) => user.id);
    const notFoundIds = userIds.filter((id) => !foundUserIds.includes(id));
    let failed = notFoundIds.map((id) => ({
      id: id,
      reason: 'User not found',
    }));

    const deletionResult = await this.userRepository.deleteUsers(foundUserIds);
    if (deletionResult.deletedCount < foundUserIds.length) {
      const stillExistingUsers =
        await this.userRepository.getUsersById(foundUserIds);
      const stillExistingIds = stillExistingUsers.map((user) => user.id);
      failed = failed.concat(
        stillExistingIds.map((id) => ({
          id: id,
          reason: 'Could not delete user',
        })),
      );
    }

    const allFailedIds = failed.map((n) => n.id);
    const successIds = foundUserIds.filter((id) => !allFailedIds.includes(id));

    return {
      successIds,
      failed,
    };
  };

  deleteUser = async (id: string) => {
    const deleteResult = await this.deleteUsers([id]);
    return deleteResult.successIds.length == 1
      ? deleteResult.successIds[0]
      : null;
  };

  findUserById = async (id: string) => {
    return await this.userRepository.getUserById(id);
  };
}

export default UserService;
