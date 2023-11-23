// Load environment variables first.
require('../config/config.js');
const ApiStatus = require('./api-status')
 Helpers = require('../helpers/includes'),
{ check, validationResult } = require('express-validator'),
jwt = require('jsonwebtoken')
//connection = require('../helpers/db.js');
/*
prepare result to show to user
eg. delete debug info, set status and message
val is the actual result before processing
TODO: convert to middleware
*/
function formatResponse(val) {
  const result = Object.assign({}, val);
  if (result.debug) { delete result.debug; }
  if (result.status && result.status.msg && !result.msg) { result.msg = result.status.msg; }//&& !result.msg to allow overriding default msg
  let httpCode = result.status.httpCode;
  result.status = result.status.code;
  let myresult = {result:result, httpCode : httpCode}
  return myresult;
}

module.exports = {
  authorize(req, res, next) {
    // authenticate
    const noAuthorization = {};
    noAuthorization['any'] = [];
    noAuthorization['PUT'] = [];
    noAuthorization['PATCH'] = [];
    noAuthorization['POST'] = ['/login','/user'];
    noAuthorization['DELETE'] = [];
    noAuthorization['GET'] = [];
    //Authorization['GET'] = ['/user', '/markers','/emitTest','/resetJob','/checkLatestAds','/validateJobAds','/rebuildJob','/newJob'];
    Helpers.logger.log(req.method +" "+ req.path);
    if(!noAuthorization[req.method])
      return res.status(400).json(formatResponse({ status: ApiStatus.INVALID_REQUEST, meta: null }).result);
    if (noAuthorization['any'].indexOf(req.path) !== -1 || noAuthorization[req.method].indexOf(req.path) !== -1) { // does not require authentication
      return next();
    }
    let authUser;
    try {
      if (typeof req.headers.authorization !== 'undefined') {
        authUser = jwt.verify(req.headers.authorization, process.env.JWT_SESSION_SECRET);
      } else {
        throw error('empty authorization header');
      }
    } catch (e) {
      res.status(401).json(formatResponse({ status: ApiStatus.NOT_LOGGED_IN, meta: null }).result);
      Helpers.logger.log({ status: ApiStatus.NOT_LOGGED_IN, meta: null });
      return;
    }
    req.body.db.get('users').findOne({"_id":authUser._id}).then((user) => {
      if (!user) {
        res.status(401).json(formatResponse({ status: ApiStatus.USER_NO_LONGER_EXISTS, meta: null }).result);
        Helpers.logger.log({ status: ApiStatus.USER_NO_LONGER_EXISTS, meta: { debug: authUser } });
        return;
      }
      delete user.password
      req.authUser = user;
      req.authUser.token = req.headers.authorization;
      next();
    }).catch((err) => {Helpers.logger.log(err);res.status(401).json(formatResponse({ status: ApiStatus.DB_ERROR, meta: err}).result)});
  },
  finish(req, res, func) {
    validation = validationResult(req)
    if (validation.errors.length) {
      Helpers.logger.log({ status: ApiStatus.VALIDATION_ERRORS, meta: validation.errors });
      return res.status(400).json(formatResponse({ status: ApiStatus.VALIDATION_ERRORS, meta: validation.errors }).result);
    }
    if (req.authUser) { Helpers.logger.log(`${req.authUser._id}: ${req.authUser.email}`); }
    req.body._path=req.path
    func(req.body, req.authUser, (result2) => {
      try {
        let myResult = formatResponse(result2);
        Helpers.logger.log(myResult.result.msg)
        res.status(myResult.httpCode).json(myResult.result);
      } catch (e) {
        Helpers.logger.log(e);
      }
    });
  }
};
