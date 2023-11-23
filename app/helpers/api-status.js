const ApiStatus = {
  NOT_LOGGED_IN: { code: -1, msg: 'You are unauthorized to do this', httpCode:401},
  ERROR: { code: 0, msg:'ERROR', httpCode:500},
  SUCCESS: { code: 1, msg:'SUCCESS', httpCode:200 },
  EMAIL_NOT_FOUND: { code: 2, msg:'EMAIL_NOT_FOUND', httpCode:404 },
  NOT_FOUND: { code: 3, msg:'NOT_FOUND', httpCode:404 },
  EMAIL_ALREADY_EXISTS: { code: 4, msg:'EMAIL_ALREADY_EXISTS', httpCode:400 },
  COULD_NOT_CREATE_USER: { code: 5, msg:'COULD_NOT_CREATE_USER', httpCode:401 },
  PASSWORD_RESET_EXPIRED: { code: 6, msg:'PASSWORD_RESET_EXPIRED', httpCode:401 },
  INVALID_PWD: { code: 7, msg:'INVALID_PWD', httpCode:401 },
  PASS_RESET_REQUEST_NOT_FOUND: { code: 8, msg:'PASS_RESET_REQUEST_NOT_FOUND', httpCode:401 },
  WRONG_PASS_RESET_TOKEN: { code: 9, msg:'WRONG_PASS_RESET_TOKEN', httpCode:401 },
  USER_NO_LONGER_EXISTS: { code: 10, msg:'USER_NO_LONGER_EXISTS', httpCode:401 },
  VALIDATION_ERRORS: { code: 11, msg:'VALIDATION_ERRORS', httpCode:400 },
  ERROR_SENDING_EMAIL: { code: 12, msg:'ERROR_SENDING_EMAIL', httpCode:401 },
  NO_CHANGES_MADE: { code: 13, msg:'NO_CHANGES_MADE', httpCode:200 },
  DB_ERROR: { code: 14, msg:'DB_ERROR', httpCode:500 },
  JOB_ALREADY_BEING_PROCESSED: { code: 15, msg:'JOB_ALREADY_BEING_PROCESSED', httpCode:400 },
  NO_PENDING_JOBS: { code: 16, msg:'NO_PENDING_JOBS', httpCode:200 },
  INVALID_REQUEST: { code: 17, msg:'INVALID_REQUEST', httpCode:400 }
};
module.exports = ApiStatus;
