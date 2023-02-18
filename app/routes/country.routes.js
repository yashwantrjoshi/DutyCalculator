const {verifyToken} = require("../middlewares/authJwt");
const {checkDuplicateUsernameOrEmail, checkRolesExisted} = require("../middlewares/verifySignUp");
const ctrl = require("../controllers/hs_code.controller");

module.exports = [
    {path: "/api/country/search", method: "get", handler: [ ctrl.getCountry]},
    {path: "/api/hs_code/details", method: "get", handler: [ ctrl.getHsCodeDetails]},
];
