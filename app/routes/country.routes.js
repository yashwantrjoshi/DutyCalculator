const {verifyToken} = require("../middlewares/authJwt");
const {checkDuplicateUsernameOrEmail, checkRolesExisted} = require("../middlewares/verifySignUp");
const ctrl = require("../controllers/hs_code.controller");
const countryctrl = require("../controllers/country.controller");

module.exports = [
    {path: "/api/country/search", method: "get", handler: [ ctrl.getCountry]},
    {path: "/api/country/currency", method: "get", handler: [countryctrl.getCountryCurrency]},
    {path: "/api/hs_code/details", method: "get", handler: [ ctrl.getHsCodeDetails]},
    {path: "/api/country/rules", method: "get", handler: [ countryctrl.getRulesOfOrigin]},
];
