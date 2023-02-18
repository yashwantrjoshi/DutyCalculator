const {QueryTypes} = require("sequelize");
const METHODS = {
    GET: "get",
    POST: "post",
    PUT: "put",
    DELETE: "delete",
    PATCH:"patch"
},
SELECT_OPTIONS = {nest: true, type: QueryTypes.SELECT};;

module.exports = {
    METHODS,
    SELECT_OPTIONS
};
