const Helpers = require('../helpers/includes'),
ApiStatus = Helpers.ApiStatus,
pick = require('lodash.pick'),
jwt = require('jsonwebtoken'),
bcrypt = require('bcrypt'),
crypto = require('crypto')

function encryptField(text) {
	if (!text) return ''
	const key = crypto.createHash('sha256').update(process.env.JWT_SESSION_SECRET).digest()
	const iv = crypto.randomBytes(16)
	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
	let encrypted = cipher.update(text, 'utf8', 'hex')
	encrypted += cipher.final('hex')
	return iv.toString('hex') + ':' + encrypted
}

function decryptField(encrypted) {
	if (!encrypted || !encrypted.includes(':')) return ''
	const key = crypto.createHash('sha256').update(process.env.JWT_SESSION_SECRET).digest()
	const [ivHex, data] = encrypted.split(':')
	const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'))
	let decrypted = decipher.update(data, 'hex', 'utf8')
	decrypted += decipher.final('utf8')
	return decrypted
}

module.exports = {
	login: async function(params, authUser, callback) {
		try{
		    let user = await params.db.get('users').findOne({ 'email': params.email })
			if (!user)
				return callback({ status: ApiStatus.EMAIL_NOT_FOUND, meta: null })
			if(!bcrypt.compareSync(params.password, user.password))
				return callback({ status: ApiStatus.INVALID_PWD, meta: null })
			user.tokenDate = new Date()
			delete user.password
			delete user.fbPasswordEnc
			user.token = jwt.sign(user, process.env.JWT_SESSION_SECRET,{expiresIn:"30d"})
			return callback({status: ApiStatus.SUCCESS, msg:'Success', meta:user})
		}
		catch(err) {
			Helpers.logger.log(err);return callback({ status: ApiStatus.DB_ERROR, meta: err})
		}//.then(() => db.close())
	  },
	newUser: async function(params, authUser, callback){
		try{
			let user = await params.db.get('users').findOne({ 'email': params.email })
			if (user)
				return callback({ status: ApiStatus.EMAIL_ALREADY_EXISTS, meta: null })
			const userObject = pick(params, ['email', 'firstName', 'lastName'])
			userObject.password = bcrypt.hashSync(params.password, 10)

			user = await params.db.get('users').insert(userObject)
			user.tokenDate = new Date()
			delete user.password
			user.token = jwt.sign(user, process.env.JWT_SESSION_SECRET, { expiresIn: '30d' })
			user.jobs = [null]
			callback({status: ApiStatus.SUCCESS, meta: user})
		}
		catch(err) {
			Helpers.logger.log(err);return callback({ status: ApiStatus.DB_ERROR, meta: err})
		}//.then(() => db.close())
	},
	updateUser: async function(params, authUser, callback){
		try{
			let user = await params.db.get('users').findOne({ '_id': authUser._id })
			if (!user)
				return callback({ status: ApiStatus.EMAIL_NOT_FOUND, meta: null })
			let userObject = pick(params,['email', 'firstName', 'lastName', 'displayAmenities'])
			if(params.password)
				userObject.password = bcrypt.hashSync(params.password, 10)
			if(params.fbEmail !== undefined)
				userObject.fbEmail = params.fbEmail
			if(params.fbPassword !== undefined)
				userObject.fbPasswordEnc = params.fbPassword ? encryptField(params.fbPassword) : ''
			userObject = await params.db.get('users').findOneAndUpdate({_id:authUser._id},{$set: userObject})
			delete userObject.password
			delete userObject.fbPasswordEnc
			userObject.tokenDate = new Date()
			userObject.token = jwt.sign(userObject, process.env.JWT_SESSION_SECRET, { expiresIn: '30d' })
			callback({status: ApiStatus.SUCCESS, meta: userObject})
		}
		catch(err) {
			Helpers.logger.log(err);return callback({ status: ApiStatus.DB_ERROR, meta: err})
		}//.then(() => db.close())
	},
	getUser: async function(params, authUser, callback) {
		params.db.get('users').findOne({email:authUser.email}).then((user) => {
			delete user.password
			delete user.fbPasswordEnc
			return callback({status:ApiStatus.SUCCESS, meta:user})
		}).catch((err) => {Helpers.logger.log(err);return callback({ status: ApiStatus.DB_ERROR, meta: err})})//.then(() => db.close())
    },
}

module.exports.encryptField = encryptField
module.exports.decryptField = decryptField