require('dotenv').config();
process.env.NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : "production";
const express = require("express");
const cors = require('cors');//Ref  https://expressjs.com/en/resources/middleware/cors.html
const {join} = require('path');
const {readdirSync, lstatSync} = require('fs');
const compression = require("compression");
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const sprintf = require('i18next-sprintf-postprocessor');
const {applyRoutes} = require("./app/config/utils");
const {i18nOptions} = require("./app/config/i18next.config");
const routes = require("./app/routes");
const db = require("./app/models");
const localesFolder = join(__dirname, './app/locales');
const app = express();
const corsOptions = {
    origin: "http://localhost:" + process.env.PORT || 5555
};
const requestLogger = require('express-sequelize-logger');

global.i18next = i18next;
i18next
    .use(Backend)
    .use(sprintf)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
        ...i18nOptions,
        preload: readdirSync(localesFolder).filter((fileName) => {
            const joinedPath = join(localesFolder, fileName);
            return lstatSync(joinedPath).isDirectory()
        }),
        backend: {
            loadPath: join(localesFolder, '{{lng}}/{{ns}}.json'),
            addPath: join(localesFolder, '{{lng}}/{{ns}}.missing.json')
        }
    });
const dbsequelize=db.sequelize;
app.use(requestLogger({sequelize:dbsequelize}));
// app.use(cors(corsOptions));
app.use(cors());
app.use(compression());
app.use(i18nextMiddleware.handle(i18next));
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));

if (process.env.NODE_ENV === "production") {
    app.use(express.static(join(__dirname, (process.env.REACT_BUILD_PATH || 'build'))));
    app.get("*", (req, res, next) => {
        if (req.originalUrl.startsWith('/api/')) {
            next();
        } else {
            res.sendFile(join(__dirname, 'build', 'index.html'));
        }
    });
} else {
    app.get("/", (req, res) => {
        // var parser = require('ua-parser-js');
        // var ua = parser(req.headers['user-agent']);
        //
        //
        //
        // res.json({
        //     ua: ua,
        //     "_readableState": req._readableState,
        //     // "_events": req._events,
        //     "_eventsCount": req._eventsCount,
        //     // "_maxListeners": req._maxListeners,
        //     // // "socket": req.socket,
        //     "httpVersionMajor": req.httpVersionMajor,
        //     "httpVersionMinor": req.httpVersionMinor,
        //     "httpVersion": req.httpVersion,
        //     "complete": req.complete,
        //     "rawHeaders": req.rawHeaders,
        //     // "rawTrailers": req.rawTrailers,
        //     // "aborted": req.aborted,
        //     // "upgrade": req.upgrade,
        //     "url": req.url,
        //     "method": req.method,
        //     "statusCode": req.statusCode,
        //     "statusMessage": req.statusMessage,
        //     // "client": req.client,
        //     // "_consuming": req._consuming,
        //     // "_dumped": req._dumped,
        //     // "next": req.next,
        //     "baseUrl": req.baseUrl,
        //     "originalUrl": req.originalUrl,
        //     "_parsedUrl": req._parsedUrl,
        //     "params": req.params,
        //     "query": req.query,
        //     // "res": req.res,
        //     "i18nextLookupName": req.i18nextLookupName,
        //     "lng": req.lng,
        //     "locale": req.locale,
        //     "language": req.language,
        //     "languages": req.languages,
        //     // "i18n": req.i18n,
        //     // "t": req.t,
        //     "body": req.body,
        //     "route": req.route
        // });
    });
}

// database sync
const sequelize_opts = process.env.DB_INIT === "true" ? {force: true} : {alter: true};
db.sequelize.sync(sequelize_opts).then().catch(err => {
    // console.error(err.message);
}).finally(() => {
    db.role.initRole();
    // if (process..env.DB_INIT === "true")
    //     initial();
});
process.on('uncaughtException', function(error) {
    // errorManagement.handler.handleError(error);
    // if(!errorManagement.handler.isTrustedError(error))
    //     process.exit(1)
});
// routes
applyRoutes(app, routes);
module.exports = app;
