const {DataTypes} = require("sequelize");
const {v4: uuidv4} = require('uuid');


module.exports = (db) => {
    const Role = db.sequelize.define("role", {
            id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            name: {type: DataTypes.STRING}
        }, {timestamps: true, underscrored: true, createdAt: "created_at", updatedAt: "updated_at"}
    );
    // Role.beforeCreate(o => o.uuid = uuidv4());

    Role.initRole = () => {
        Role.create({name: "user"});
        Role.create({name: "moderator"});
        Role.create({name: "admin"});
    }

    Role.createRole = (data) => {
        return Role.create({name: data?.name});
    }

    return Role;
};
