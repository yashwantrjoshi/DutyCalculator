const fs = require("fs"),
    util = require("util"),
    multer = require("multer"),
    file_config = require("../config/file.config");

let storage = multer.diskStorage({
        destination: (req, file, cb) => {
            fs.mkdirSync(file_config.BASE_URL, {recursive: true});
            cb(null, file_config.BASE_URL);
        },
        filename: (req, file, cb) => {
            // console.log(file.originalname);
            cb(null, file.originalname);
        },
    }),
    uploadFile = multer({
        storage: storage,
        limits: {fileSize: file_config.MAXSIZE}
    }).single("file"),
    uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;