const {DataTypes} = require("sequelize");
const {v4: uuidv4} = require('uuid');
module.exports = (db) => {
    const User = db.sequelize.define("user", {
            id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            username: {type: DataTypes.STRING, unique: true, defaultValue: ""},
            email: {type: DataTypes.STRING, unique: true, defaultValue: ""},
            phone: {type: DataTypes.STRING, unique: true, defaultValue: ""},
            password: {type: DataTypes.STRING, defaultValue: ""},
            name: {type: DataTypes.STRING, defaultValue: ""},
            photoUrl: {type: DataTypes.STRING, defaultValue: ""},
            firstName: {type: DataTypes.STRING, defaultValue: ""},
            lastName: {type: DataTypes.STRING, defaultValue: ""},
            token: {type: DataTypes.STRING, defaultValue: ""}, /* authToken idToken */
            refreshToken: {type: DataTypes.STRING, defaultValue: ""},
            provider: {type: DataTypes.STRING, defaultValue: ""},
            otp: {type: DataTypes.STRING(10), defaultValue: ""},
            response: {type: DataTypes.TEXT, defaultValue: ""},
        },
        {timestamps: true, underscrored: true, createdAt: "created_at", updatedAt: "updated_at"}
    );

    User.createUser = async (data) => {
        const _role = await db.role.findOne({where: {name: data?.role || "user"}});
        data.id = null;
        data.username = data?.username || data?.email || data?.phone;
        data.password = data?.password || "";
        data.response = data?.response && typeof data?.response !== "string" ? JSON.stringify(data?.response) : data?.response;
        data.token = data?.token || data?.idToken || data?.authToken || "";

        const _user = await User.create(data);
        await db.UserRoles.create({user_id: _user.id, role_id: _role.id});
        return _user;
    }

    User.updateUser = async (data, _where = {id: 0}) => {
        const _user = await User.update(data, {where: _where}, {returning: true});
        return _user;
    }


    return User;
};
