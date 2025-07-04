import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config/validatedConfig.js';
import type { IProfile } from '../types/profile.types.js';
import type { IRoleService } from '../role/role.types.js';
import type { IUserRepository, IUserService } from './user.types.js';

class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private roleService: IRoleService,
  ) {}

  register = async (username: string, password: string) => {
    try {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const newUsers = await this.userRepository.createUsers([
        { username: username, hash: hashedPassword, role: 'user' },
      ]);

      return newUsers[0];
    } catch (err) {
      console.error('Error in register:', err);
      return null;
    }
  };

  login = async (username: string, password: string) => {
    try {
      const user = await this.findUserByUsername(username);

      if (!user) {
        throw new Error('User not found');
      }

      const isMatch = bcrypt.compareSync(password, user.hash);

      if (!isMatch) {
        throw new Error('Invalid password');
      }

      const permissions = await this.roleService.getPermissionsForRole(
        user.role,
      );

      if (!permissions) {
        throw new Error('Error in getPermissionsForRole');
      }

      const token = jwt.sign(
        {
          id: user.id,
          permissions: permissions,
        },
        config.privateKey,
        { expiresIn: '15min' },
      );

      return token;
    } catch (err) {
      console.error('Error in login:', err);
      return null;
    }
  };

  getProfile = async (id: string) => {
    try {
      const user = await this.userRepository.getUserById(id);
      if (!user) {
        throw new Error('User not found');
      }

      const permissions = await this.roleService.getPermissionsForRole(
        user.role,
      );

      if (!permissions) {
        throw new Error('Error in getPermissionsForRole');
      }

      const profile = {
        id: id,
        username: user.username,
        role: user.role,
        permissions: permissions,
      } as IProfile;

      return profile;
    } catch (err) {
      console.error('Error in getProfile:', err);
      return null;
    }
  };

  findUserByUsername = async (username: string) => {
    try {
      return await this.userRepository.getUserByUsername(username);
    } catch (err) {
      console.error('Error in findUserByUsername:', err);
      return null;
    }
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
