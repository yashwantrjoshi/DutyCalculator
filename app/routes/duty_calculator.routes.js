const {verifyToken} = require("../middlewares/authJwt");
const {checkDuplicateUsernameOrEmail, checkRolesExisted} = require("../middlewares/verifySignUp");
const ctrl = require("../controllers/duty_calculator.controller");

module.exports = [
    {path: "/api/dutyCalculator/getUserInput", method: "post", handler: [ ctrl.getUserInput]},
    {path: "/api/dutyCalculator/getDuty", method: "post", handler: [ ctrl.getDuty]},
    {path: "/api/dutyCalculator/getFTA", method: "post", handler: [ ctrl.getFTA]},
    {path: "/api/healthCheck", method: "get", handler: [ ctrl.check]},
];
