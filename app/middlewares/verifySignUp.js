const db = require("../models");
const {Op, QueryTypes} = require("sequelize");
const request = require("request");
const {R40X} = require("../config/utils");
const ROLES = db.role;
const User = db.user;

const captchaVerify = (req, res, next) => {
	const secretKey = "6LcY6sMiAAAAALnmvynuMtEqlQo2U_EEnT_ZP0zg",
		verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body?.token;
	request(verificationUrl, async function (error, response, body) {
		body = JSON.parse(body);
		if (body.success !== undefined && !body.success) {
			next();
		} else {
			R40X(res, 'Invalid captcha');
		}
	});
};
const checkDuplicateUsernameOrEmail = (req, res, next) => {
	// Username
	const _body = req.body;
	if (_body?.username || _body?.email || _body?.phone) {
		User.findOne({
			where: {
				[Op.or]: [
					{username: _body?.username || ""},
					{email: _body?.email || ""},
					{phone: _body?.phone || ""}
				]
			}
		}, {raw: false, plain: false, nest: true, type: QueryTypes.SELECT, logging: (str) => console.info("checkDuplicateUsernameOrEmail=", str)}).then(user => {
			console.log("checkDuplicateUsernameOrEmail==", user);
			if (",FACEBOOK,GOOGLE".indexOf(_body.provider + "".toUpperCase()) > -1) {
				next();
			} else if (user) {
				return res.status(400).send({message: "Failed! Username is already in use!"});
			}

		});
	} else {
		res.status(400).send({message: "Failed! Username/email/mobile is required!"});
	}
};

const checkRolesExisted = (req, res, next) => {
	if (req.body.roles) {
		for (let i = 0; i < req.body.roles.length; i++) {
			if (!ROLES.includes(req.body.roles[i])) {
				res.status(400).send({
					message: "Failed! Role does not exist = " + req.body.roles[i]
				});
				return;
			}
		}
	}

	next();
};

module.exports = {
	checkDuplicateUsernameOrEmail,
	checkRolesExisted,
	captchaVerify
};
