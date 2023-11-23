/**
 * Loads environment variables.
 *
 * Environment variables are set using the NODE_ENV variable. For example, to
 * run in production, one should run:
 *
 *   NODE_ENV=production node index.js
 *
 * If no environment is specified, the "development" environment is assumed
 * by default.
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'dev'
const configPath=`./config/${process.env.NODE_ENV}.env`
const result=require('dotenv').config({path:configPath});
 
if (result.error) {
  throw result.error
}
