module.exports = {
	/**
	 * sets timeout (sleep if awaited)
	 * @param {string} ms - sleep duration (in ms)
	 * @returns {null}
	 */
	sleep: function (params) { //should always be called with await
		if(Number.isInteger(params))
			params={ms:params}
		return new Promise(resolve => setTimeout(resolve, params.ms));
	}
}