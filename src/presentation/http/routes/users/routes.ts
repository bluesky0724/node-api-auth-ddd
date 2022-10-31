import express, { Response, Router } from 'express';
import {
  validateUserToken,
  validate,
  validateCreateUserBody,
} from '../../middleware/endpointValidator';
import { asyncWrapper } from '../../utils/asyncWrapper';
import { GetUserQuery, UpdateUserQuery } from '../../../../domain/users/service';
import { IServices } from '../../../../common/interfaces/IServices';
import { IExpressRequest } from '../../../../common/interfaces/IExpressRequest';

const router = express.Router({ mergeParams: true });

interface IUsersRouter {
  init(services: IServices): Router;
}

export const usersRouter: IUsersRouter = {
  init(services: IServices) {
    router.get(
      '/:userId',
      validate,
      asyncWrapper(async (req: IExpressRequest, res: Response) => {
        const result = await services.usersService.getUser({
          userId: req.params.userId,
        } as GetUserQuery);
        return res.send({
          data: {
            ...result.user.toUserResponse(),
          },
        });
      }),
    );

    router.post(
      '/',
      validateCreateUserBody(),
      validate,
      asyncWrapper(async (req: IExpressRequest, res: Response) => {
        const user = await services.usersService.createUser({
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
        });
        return res.send({
          data: user.toUserResponse(),
        });
      }),
    );

    router.put(
      '/:userId',
      validateCreateUserBody(),
      validate,
      asyncWrapper(async (req: IExpressRequest, res: Response) => {
        const user = await services.usersService.updateUser({
          userId: req.params.userId,
        } as UpdateUserQuery, {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
        });
        return res.send({
          data: user.toUserResponse(),
        });
      }),
    );

    router.delete(
      '/:userId',
      validateCreateUserBody(),
      validate,
      asyncWrapper(async (req: IExpressRequest, res: Response) => {
        const result = await services.usersService.deleteUser(req.params.userId);
        return res.send({
          data: result,
        });
      }),
    );

    return router;
  },
};
