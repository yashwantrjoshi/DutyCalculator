const {DataTypes} = require("sequelize");
const {v4: uuidv4} = require('uuid');
module.exports = (db) => {
    const UserLogs = db.sequelize.define("user_logs", {
            type: {type: DataTypes.STRING(10), defaultValue: "LOGIN"},
            tags: {type: DataTypes.STRING, defaultValue: "General"},
            message: {type: DataTypes.TEXT, defaultValue: ""},
            user_id: {type: DataTypes.INTEGER, defaultValue: 0},
            ip: {type: DataTypes.STRING, defaultValue: ""},
            browser: {type: DataTypes.STRING, defaultValue: ""},
            os: {type: DataTypes.STRING, defaultValue: ""},
            device: {type: DataTypes.STRING, defaultValue: ""},
            location: {type: DataTypes.STRING, defaultValue: ""},
            latitude: {type: DataTypes.STRING, defaultValue: ""},
            longitude: {type: DataTypes.STRING, defaultValue: ""},
            country: {type: DataTypes.STRING, defaultValue: ""},
            country_code: {type: DataTypes.STRING, defaultValue: ""},
            region: {type: DataTypes.STRING, defaultValue: ""},
            region_name: {type: DataTypes.STRING, defaultValue: ""},
            city: {type: DataTypes.STRING, defaultValue: ""},
            zip: {type: DataTypes.STRING, defaultValue: ""},
            timezone: {type: DataTypes.STRING, defaultValue: ""},
            currency: {type: DataTypes.STRING, defaultValue: ""},
            asn: {type: DataTypes.STRING, defaultValue: ""},
            org: {type: DataTypes.STRING, defaultValue: ""},
            isp: {type: DataTypes.STRING, defaultValue: ""},
            proxy: {type: DataTypes.STRING, defaultValue: ""},
            tor: {type: DataTypes.STRING, defaultValue: ""},
            vpn: {type: DataTypes.STRING, defaultValue: ""},
            crawler: {type: DataTypes.STRING, defaultValue: ""},
            source: {type: DataTypes.STRING, defaultValue: ""},//bot, web, api, mobile, desktop, tablet, smarttv, wearable, embedded
            user_agent: {type: DataTypes.STRING, defaultValue: ""},
            referrer: {type: DataTypes.STRING, defaultValue: ""},
            referrer_domain: {type: DataTypes.STRING, defaultValue: ""},
            referrer_url: {type: DataTypes.STRING, defaultValue: ""},
            referrer_search: {type: DataTypes.STRING, defaultValue: ""},
            request_from: {type: DataTypes.STRING, defaultValue: ""},
            request_what: {type: DataTypes.STRING, defaultValue: ""},
            request_to: {type: DataTypes.STRING, defaultValue: ""},
            is_active: {type: DataTypes.BOOLEAN, defaultValue: true},
            is_deleted: {type: DataTypes.BOOLEAN, defaultValue: false},
            created_by: {type: DataTypes.INTEGER, defaultValue: 0},
            updated_by: {type: DataTypes.INTEGER, defaultValue: 0},
            deleted_by: {type: DataTypes.INTEGER, defaultValue: 0}
        },
        {
            timestamps: true,
            underscrored: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            beforeCreate: (user_logs, options) => {
                user_logs.type = (user_logs?.type || "LOGIN").toUpperCase();
            },

        }

    );

    UserLogs.createUser = async (data) => {
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

    UserLogs.updateUser = async (data, _where = {id: 0}) => {
        const _user = await User.update(data, {where: _where}, {returning: true});
        return _user;
    }


    return User;
};
