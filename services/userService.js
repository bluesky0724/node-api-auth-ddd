// DOMAIN LAYER
// Has the userInterface as a dependency. The DriverService does not know
// nor does it care where the user models came from. This is abstracted away
// by the implementation of the interfaces. It just calls the needed interfaces
// gets the results and usually applies some business logic on them.

const debug = require('debug')('services:USER');


function init({ userInterface }) {
  debug('------- INIT SERVICES:USER ---------');

  const getUsersList = () => {
    debug('getDriversList called');
    return userInterface.getList()
      .then(drivers => drivers)
      .catch(error => Promise.reject(error));
  };

  const createUser = (options) => {
    debug('createDriver called');
    return userInterface.create(options)
      .then(driver => driver)
      .catch(error => Promise.reject(error));
  };

  const getUser = (options) => {
    debug('createDriver called');
    return userInterface.get(options)
      .then(driver => driver)
      .catch(error => Promise.reject(error));
  };


  return {
    getList: getUsersList,
    create: createUser,
    get: getUser,
  };
}

module.exports.init = init;