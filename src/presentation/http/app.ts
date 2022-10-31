import http from 'http';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import bodyParser from 'body-parser';
import logger from 'morgan';
import helmet from 'helmet';
import path from 'path';
import jwt from 'express-jwt';
import { authRouter } from './routes/auth/routes';
import { usersRouter } from './routes/users/routes';
import { errorHandler } from './routes/errors/routes';
import { IServices } from '../../common/interfaces/IServices';
import config from '../../configuration';
import * as jose from 'jose';
import configuration from '../../configuration';
import fs from 'fs';
const { jwtSecret } = config;
const compress = compression();
const app = express();

const privateKey = fs.readFileSync('src/configuration/private.pem', 'utf-8');

app.disable('x-powered-by');
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(compress);
app.use(logger('dev'));
app.use(cors());

export const appServerFactory = {
  init(services: IServices): http.Server {
    
    app.use(express.static(path.join(__dirname, 'public')));
    
      app.use(jwt({
        secret: privateKey,
        algorithms: ['RS512'],
      }).unless({
        path: ['/auth/register', '/auth/login'],
      }));
    
    app.use('/auth', authRouter.init(services));
    app.use('/users', usersRouter.init(services));
    app.use(errorHandler);
    return http.createServer(app);
  },
};
