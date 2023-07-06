const {verifyToken} = require("../middlewares/authJwt");
const {checkDuplicateUsernameOrEmail, checkRolesExisted} = require("../middlewares/verifySignUp");
const ctrl = require("../controllers/hs_code.controller");

module.exports = [
	{path: "/api/hs_code/search", method: "get", handler: [ctrl.getHsCode]},
	{path: "/api/hs_code/details", method: "get", handler: [ctrl.getHsCodeDetails]},
	{path: "/api/country/all", method: "get", handler: [ctrl.getCountry]},
	{path: "/api/currency/all", method: "get", handler: [ctrl.getCurrency]},
	{path: "/api/getProductFromCountryCode", method: "get", handler: [ctrl.getProductFromCountryCode]},
	{path: "/api/getUserInput", method: "get", handler: [ctrl.getUserInput]},
	{path: "/api/hsCountrySearch", method: "get", handler: [ctrl.hsCountrySearch]},
];
