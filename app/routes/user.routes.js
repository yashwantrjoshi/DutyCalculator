const {verifyToken} = require("../middlewares/authJwt");
const {captchaVerify, checkDuplicateUsernameOrEmail, checkRolesExisted} = require("../middlewares/verifySignUp");
const ctrl = require("../controllers/user.controller");

module.exports = [
    {path: "/api/auth/signUp", method: "post", handler: [captchaVerify, checkDuplicateUsernameOrEmail, checkRolesExisted, ctrl.signup]},
    {path: "/api/auth/signIn", method: "post", handler: [ctrl.signIn]},
    {path: "/api/auth/refreshToken", method: "post", handler: [ctrl.refreshToken]},
    {path: "/api/auth/changePassword", method: "post", handler: [ctrl.changePassword]},
    {path: "/api/auth/forgotPassword", method: "post", handler: [ctrl.forgotPassword]},
    {path: "/api/auth/users", method: "get", handler: [verifyToken, ctrl.getAllUser]},
    {path: "/api/auth/users/:id", method: "get", handler: [verifyToken, ctrl.getUserById]},
    {path: "/api/auth/users/:id", method: "post", handler: [verifyToken, ctrl.updateUser]}
];
