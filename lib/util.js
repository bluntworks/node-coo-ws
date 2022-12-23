const CryptoJS = require('crypto-js')
const api = module.exports = {}
const uuid = require('uuid')

export function  nonce() {
	return uuid.v4()
}
export function getHmac(nonce, secret) {
	return CryptoJS
		.enc
		.Base64
		.stringify(
			CryptoJS.HmacSHA256(nonce, secret)
		)
}

export function checkPassword(ipass, epass, secret) {
  var hash = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(ipass, secret));
  return hash === epass
}

export function hashPass(pass, xsec) {
  var hash = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(pass, xsec));
  return hash
}
