require('express-jsend');
const express = require('express');
const compress = require('compression')();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressValidator = require('express-validator');
const helmet = require('helmet');
const EndpointValidator = require('../middlewares/endpointValidator');
const usersRouter = require('./routes/users');
const errorRoute = require('./routes/errors');

const endpointValidator = new EndpointValidator();
const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(compress);
app.use(logger('dev'));
app.use(expressValidator(endpointValidator.settings));

module.exports = (services) => {
  const usersRoutes = usersRouter.init(services);

  app.use('/users', usersRoutes);

  app.use(errorRoute);

  return app;
};
