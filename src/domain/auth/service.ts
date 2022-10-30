// DOMAIN LAYER
// Has the userRepository as a dependency. The authService does not know
// nor does it care where the user models came from. This is abstracted away
// by the implementation of the repositories. It just calls the needed repositories

import { RateLimiterRes } from 'rate-limiter-flexible';
import { IGetUserQuery } from '../users/usersRepository';
import errors from '../../common/errors';
import {
  getRetryAfterSeconds,
} from '../../common/utils/helper';
import { User } from '../users/model';
import { IRepositories } from '../../common/interfaces/IRepositories';
import { Token } from '../token/model';
import { IRegisterAdminDto } from './authenticationRepository';
import { Admin } from './model';

export interface IAuthService {
  register(registerAdminDto: IRegisterAdminDto): Promise<Admin>
  login(email: string, password: string): Promise<Token>
}

interface IAuthServiceFactory {
  init(repositories: IRepositories): IAuthService;
}

export const authServiceFactory: IAuthServiceFactory = {
  init(repositories: IRepositories) {
    const getUsernameKey = (username: string) => `${username}`;

    async function register(registerAdminDto: IRegisterAdminDto): Promise<Admin> {
      return repositories.authenticationRepository.registerAdmin(registerAdminDto);
    }

    const handleCorrectLoginPassword = async (resUsername: RateLimiterRes | null, usernameKey: string, user: User): Promise<{
      token: Token;
      user: User;
    }> => {
      if (resUsername !== null && resUsername.consumedPoints > 0) {
        await repositories.recourceLimiterRepository.deleteUserKeyForFailedLogin(usernameKey);
      }
      const token = await repositories.authenticationRepository.createAdminToken(new Admin("","","","", new Date()));
      return {
        token,
        user,
      };
    };

    const handleWrongLoginPassword = async (usernameKey: string, user: User): Promise<never> => {
      try {
        const promises = [];
        if (user) {
          promises.push(repositories.recourceLimiterRepository.consumeUserPointsForFailedLogin(usernameKey));
        }
        await Promise.all(promises);
        throw new errors.Unauthorized('WRONG_PASSWORD');
      } catch (rlRejected: any) {
        if (rlRejected instanceof Error) {
          throw rlRejected;
        } else {
          const retryAfterSecs = getRetryAfterSeconds(rlRejected.msBeforeNext);
          throw new errors.TooManyRequests(`Too Many Requests. Retry after ${String(retryAfterSecs)} seconds`);
        }
      }
    };

    // eslint-disable-next-line consistent-return
    async function login(email: string, password: string): Promise<Token> {
        const admin = await repositories.authenticationRepository.getAdminByEmail(email);
        const isPasswordCorrect = await repositories.authenticationRepository.comparePassword(password, admin.password)
          .catch((err) => {
            console.error(`Error in authentication of user with email: ${email}`, err);
            return undefined;
          });
        if (!isPasswordCorrect) {
          throw new errors.Unauthorized('WRONG_PASSWORD');
        }
        const token = await repositories.authenticationRepository.createAdminToken(admin);
        return token;
    }

    return {
      register,
      login,
    };
  },
};
