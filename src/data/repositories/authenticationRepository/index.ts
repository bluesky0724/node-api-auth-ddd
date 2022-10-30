import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Token } from '../../../domain/token/model';
import errors from '../../../common/errors';
import { IAuthenticationRepository, IRegisterAdminDto } from '../../../domain/auth/authenticationRepository';
import { Admin } from '../../../domain/auth/model';
import { AdminDao } from '../../infrastructure/db/schemas/Admin';
import logging from '../../../common/logging';
import configuration from '../../../configuration';
import { USER_ROLE, USER_TOKEN_EXPIRATION } from '../../../common/constants';

const SALT_ROUNDS = 10;

interface IAuthenticationRepositoryFactory {
  init(): IAuthenticationRepository;
}

export const authenticationRepositoryFactory: IAuthenticationRepositoryFactory = {
  init(): IAuthenticationRepository {
    async function comparePassword(password: string, dbPassword: string): Promise<boolean> {
      try {
        const match = await bcrypt.compare(password, dbPassword);
        if (!match) {
          throw new Error('Authentication error');
        }
        return match;
      } catch (error) {
        throw new errors.Unauthorized('Wrong password.');
      }
    }

    async function hashPassword(password: string): Promise<string> {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      return bcrypt.hash(password, salt);
    }

    // async function createAdminToken(user: User): Promise<Token> {
    //   logging.info('Create consultant token called');
    //   const jwtSecret = config.jwtSecret as string;
    //   const token = {
    //     accessToken: jwt.sign({
    //       email: user.email,
    //       fullName: user.fullName,
    //       _id: user.id,
    //       roles: [USER_ROLE],
    //     }, jwtSecret, {
    //       expiresIn: USER_TOKEN_EXPIRATION,
    //     }),
    //     tokenType: 'Bearer',
    //     roles: [USER_ROLE],
    //     expiresIn: USER_TOKEN_EXPIRATION,
    //   };
    //   return new Token(token.accessToken, token.tokenType, token.expiresIn, token.roles);
    // }

    async function registerAdmin(registerAdminDto: IRegisterAdminDto): Promise<Admin> {
      let adminModel = new AdminDao(registerAdminDto);
      adminModel = await adminModel.save();
      return adminModel.toAdmin();
    }

    async function createAdminToken(admin: Admin): Promise<Token> {
         logging.info('Create consultant token called');
      const jwtSecret = configuration.jwtSecret as string;
      const token = {
        accessToken: jwt.sign({
          _id: admin.id,
        }, jwtSecret, {
          expiresIn: USER_TOKEN_EXPIRATION,
        }),
        tokenType: 'Bearer',
        roles: [USER_ROLE],
        expiresIn: USER_TOKEN_EXPIRATION,
      };
      return new Token(token.accessToken, token.tokenType, token.expiresIn, token.roles);
    }

    async function verifyToken(token: string, secret: string): Promise<JwtPayload> {
      return jwt.verify(token, secret);
    }

    async function getAdminByEmail(email: string) : Promise<Admin> {
      let admin = await AdminDao.findOne({email});
      if(!admin) throw new errors.NotFound('Admin not found.');
      return admin.toAdmin();
    }

    return {
      verifyToken,
      comparePassword,
      hashPassword,
      registerAdmin,
      createAdminToken,
      getAdminByEmail
    };
  },
};
