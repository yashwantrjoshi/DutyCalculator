const config = require("../config/config.js");
const {Sequelize, DataTypes, Op} = require("sequelize");

const sequelize = new Sequelize(
    config.db.DB_NAME,
    config.db.DB_USER,
    config.db.DB_PASS,
    {
        host: config.db.DB_HOST,
        dialect: config.db.dialect,
        logging: process.env.DB_DEBUG === 'true' ? console.info : false,
        freezeTableName: true,

        poll: {
            max: config.db.pool.max,
            min: config.db.pool.min,
            acquire: config.db.pool.acquire,
            idle: config.db.pool.idle
        }
    }
);

const db = {};

db.Sequelize = Sequelize;
db.Op = Op;
db.sequelize = sequelize;

db.user = require("./user.model")(db);
// db.books = require("./book.model")(sequelize, Sequelize, DataTypes);
db.role = require("./role.model")(db);

db.UserRoles = sequelize.define('user_roles', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    }
});

db.role.belongsToMany(db.user, {as: "users", through: db.UserRoles,foreignKey: "role_id",otherKey: "user_id"});
db.user.belongsToMany(db.role, {as: "roles", through: db.UserRoles,foreignKey: "user_id",otherKey: "role_id"});


module.exports = db;
