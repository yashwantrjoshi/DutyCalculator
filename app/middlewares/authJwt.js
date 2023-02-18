const jwt = require("jsonwebtoken");
const config = require("../config/config.js");
const db = require("../models");
const fs = require("fs");
const path = require("path");
const User = db.user;
let privateKEY = fs.readFileSync(path.join(process.cwd(), './app/data/duty_private.key'), 'utf8');
let publicKEY = fs.readFileSync(path.join(process.cwd(), './app/data/duty_public.key'), 'utf8');

const JWT = {
    sign: (payload, $Options) => {
        /*
         sOptions = {
          issuer: "Authorizaxtion/Resource/This server",
          subject: "iam@user.me",
          audience: "Client_Identity" // this should be provided by client
         }
        */
        // Token signing options
        const signOptions = {
            issuer: $Options?.issuer || process.env.JWT_ISSUER,
            subject: $Options?.subject || process.env.JWT_SUBJECT,
            audience: $Options?.audience || process.env.JWT_AUDIENCE,
            expiresIn: process.env.JWT_EXPIRESIN,    // 30 days validity
            algorithm: process.env.JWT_ALGORITHM
        };
        return jwt.sign(payload, privateKEY, signOptions);
    },
    verify: (token, $Option) => {
        /*
         vOption = {
          issuer: "Authorization/Resource/This server",
          subject: "iam@user.me",
          audience: "Client_Identity" // this should be provided by client
         }
        */
        const verifyOptions = {
            issuer: $Option?.issuer || process.env.JWT_ISSUER,
            subject: $Option?.subject || process.env.JWT_SUBJECT,
            audience: $Option?.audience || process.env.JWT_AUDIENCE,
            expiresIn: process.env.JWT_EXPIRESIN,
            algorithm: [process.env.JWT_ALGORITHM]
        };
        try {
            return jwt.verify(token, publicKEY, verifyOptions);
        } catch (err) {
            return false;
        }
    },
    decode: (token) => {
        return jwt.decode(token, {complete: true});
        //returns null if token is invalid
    }
}
const verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"];

    if (!token) {
        return res.status(403).send({
            message: "No token provided!"
        });
    }

    const decoded = JWT.verify(token);
    if (decoded?.id) {
        req.userId = decoded.id;
        next();
    } else {
        return res.status(401).send({
            message: "Unauthorized!"
        });
    }
};

const isAdmin = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
        user.getRoles().then(roles => {
            for (let i = 0; i < roles.length; i++) {
                if (roles[i].name === "admin") {
                    next();
                    return;
                }
            }

            res.status(403).send({
                message: "Require Admin Role!"
            });
            return;
        });
    });
};

const isModerator = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
        user.getRoles().then(roles => {
            for (let i = 0; i < roles.length; i++) {
                if (roles[i].name === "moderator") {
                    next();
                    return;
                }
            }

            res.status(403).send({
                message: "Require Moderator Role!"
            });
        });
    });
};

const isModeratorOrAdmin = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
        user.getRoles().then(roles => {
            for (let i = 0; i < roles.length; i++) {
                if (roles[i].name === "moderator") {
                    next();
                    return;
                }

                if (roles[i].name === "admin") {
                    next();
                    return;
                }
            }

            res.status(403).send({
                message: "Require Moderator or Admin Role!"
            });
        });
    });
};

module.exports = {
    verifyToken,
    isAdmin,
    isModerator,
    isModeratorOrAdmin,
    JWT
};
