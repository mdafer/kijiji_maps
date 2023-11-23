logger = require('../helpers/logging')
/**
 * ClassMiddlewareModel
 * @module Models/ClassMiddleware
 */
module.exports = {
	/**
	 * adds a middleware to all functions in an object
	 * injects {function} originalFunction - injects originalFunction to middlewareFunction as a parameter
	 * @param {object} middlewareObject - the object where the middleware is going to be injected in every function
	 * @param {function} middlewareFunction - the main function of the middleware
	 * @param {function} [middlewareFunctionParams] - the params to be passed to the middleware function (if not using .bind())
	 * @param {Array.<string>} [middlewareExclude] - the functions to be excluded from the middleware injection
	 * @returns {null}
	 */

	addToObject: function (_params){
		for(const key of Object.getOwnPropertyNames(_params.middlewareObject)) {
			if(_params.middlewareExclude && _params.middlewareExclude.contains(key))
				continue

		    const originalFunction = _params.middlewareObject[key]
		    
		    if(_params.middlewareObject[key].constructor.name === "AsyncFunction")
		    	_params.middlewareObject[key] = async function(originalFunctionParams) {
					return await _params.middlewareFunction({..._params.middlewareFunctionParams, originalFunction, originalFunctionParams})
		    	}
			else if(_params.middlewareObject[key].constructor.name === "Function")
				_params.middlewareObject[key] = function(originalFunctionParams) {
					return _params.middlewareFunction({..._params.middlewareFunctionParams, originalFunction, originalFunctionParams})
				}
			else
				logger.log('Middleware injection for '+_params.middlewareObject[key]+' with constructor name: '+_params.middlewareObject[key].constructor.name+' was skipped as it is not a valid function')
		}
	},

	/**
	 * surrounds a function with a try-catch block and retries on error for a predefined number of retries
	 * @param {function} originalFunction - the function to apply the retrial logic on
	 * @param {function} originalFunctionParams - the parameters to be passed to the function (if not already using .bind())
	 * @param {function} [onError=null] - the function to call in case of error
	 * @param {int} [retries=2] - the number of retries to be made 
	 * @param {int} [delay=1000] - the number of ms to wait before the next retrial
	 * @returns {null}
	 */
	retryFunction: async function (params){
		params.retries = params.retries || 2
		params.delay = params.delay || 1000
		for(let i=0; i<=params.retries;i++){
		    try{
		    	if(params.originalFunction.constructor.name === "AsyncFunction")
		    		return await params.originalFunction(params.originalFunctionParams)
		    	else
		    		return params.originalFunction(params.originalFunctionParams)
		    }
		    catch(e)
		    {
		    	if(params.onError)
					if(params.onError.constructor.name === "AsyncFunction")
			    		await params.onError(e);
			    	else
			    		params.onError(e);

				if(i<params.retries)
		    		logger.log('Retrying function: '+params.originalFunction.name+' for the nth time: '+(i+1))
		    	else
					throw e
		    }
		    await new Promise(resolve => setTimeout(resolve, params.delay)); //not using common Model because of circular dependency
		}
	}
}