const db = require("../models");
const {R20X, R40X} = require("../config/utils");
const {JWT} = require("../middlewares/authJwt");
const request = require('request');
const {Op, QueryTypes} = require("sequelize");

const captchaVerify = (token) => {
	const secretKey = "6LcY6sMiAAAAALnmvynuMtEqlQo2U_EEnT_ZP0zg",
		verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + token;
	console.log("verificationUrl", verificationUrl);
	return new Promise((resolve, reject) => {
		request(verificationUrl, async function (error, response, body) {
			body = JSON.parse(body);
			if (body.success !== undefined && !body.success) {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	});
}

const tokenVerify = (provider, token) => {
	let secretKey = "", verificationUrl = "";
	return new Promise((resolve, reject) => {
		if (provider === "FACEBOOK") {
			secretKey = "6LcY6sMiAAAAALnmvynuMtEqlQo2U_EEnT_ZP0zg";
			verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + token;
			console.log("verificationUrl", verificationUrl);
			request(verificationUrl, async function (error, response, body) {
				body = JSON.parse(body);
				if (body.success !== undefined && !body.success) {
					resolve(true);
				} else {
					resolve(false);
				}
			});
		} else if (provider === "GOOGLE") {
			secretKey = "6LcY6sMiAAAAALnmvynuMtEqlQo2U_EEnT_ZP0zg";
			verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + token;
			console.log("verificationUrl", verificationUrl);
			request(verificationUrl, async function (error, response, body) {
				body = JSON.parse(body);
				if (body.success !== undefined && !body.success) {
					resolve(true);
				} else {
					resolve(false);
				}
			});
		} else {
			resolve(false);
		}
	});
}

exports.signup = async (req, res) => {
	const User = db.user, _body = req.body;
	User.findOne({
		where: {
			[Op.or]: [
				{username: _body?.username || ""},
				{email: _body?.email || ""},
				{phone: _body?.phone || ""}
			]
		}
	}, {
		raw: false, plain: false, nest: true,
		type: QueryTypes.SELECT,
		logging: (str) => console.info("checkDuplicateUsernameOrEmail=", str)
	})
		.then(async user => {
			console.log("checkDuplicateUsernameOrEmail==", user);
			if (user && ",FACEBOOK,GOOGLE".indexOf(_body.provider + "".toUpperCase()) > -1) {
				let data = {
					id: user?.id,
					name: user?.name,
					email: user?.email,
					firstName: user?.firstName,
					lastName: user?.lastName,
					photoUrl: user?.photoUrl,
				}
				data.token = JWT.sign({id: user?.id});
				let legit = JWT.verify(data.token);
				console.log("\nJWT verification result: " + JSON.stringify(legit));
				R20X(res, data);
			} else if (!user || ",FACEBOOK,GOOGLE".indexOf(_body.provider + "".toUpperCase()) === -1) {
				await db.user.createUser(req.body).then(user => {
					let data = {
						id: user?.id,
						name: user?.name,
						email: user?.email,
						firstName: user?.firstName,
						lastName: user?.lastName,
						photoUrl: user?.photoUrl,
					}
					data.token = JWT.sign({id: user?.id});
					let legit = JWT.verify(data.token);
					console.log("\nJWT verification result: " + JSON.stringify(legit));
					R20X(res, data);

					// const token = JWT.sign(user);
					// // let legit = JWT.verify(data.token);
					// // console.log("\nJWT verification result: " + JSON.stringify(legit));
					// R20X(res, {token}, HTTP_STATUS_CODE.OK, user.msg);
				}).catch(err => {
					R40X(res, err);
				});
			} else if (!user || ",FACEBOOK,GOOGLE".indexOf(_body.provider + "".toUpperCase()) === -1) {
				return res.status(400).send({message: "Failed! Username is already in use!"});
			} else if (user) {
				return res.status(400).send({message: "Failed! Username is already in use!"});
			}
		});
	// console.log(req.header('x-forwarded-for') || req.connection.remoteAddress);
};
exports.signIn = (req, res) => {
	res.status(200).send("User Content.");
};
exports.refreshToken = (req, res) => {
	res.status(200).send("Admin Content.");
};
exports.changePassword = (req, res) => {
	res.status(200).send("Moderator Content.");
};
exports.forgotPassword = (req, res) => {
	res.status(200).send("Moderator Content.");
};
exports.getAllUser = (req, res) => {
	res.status(200).send("Moderator Content.");
};
exports.getUserById = (req, res) => {
	res.status(200).send("Moderator Content.");
};
exports.updateUser = (req, res) => {
	res.status(200).send("Moderator Content.");
};
