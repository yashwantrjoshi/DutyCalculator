const db = require("../models");
const {SELECT_OPTIONS} = require("./CONSTANT");
const {returnError, returnData} = require("./db.common");
const middleware = (router, middleware) => {
        for (const f of middleware) {
            f(router);
        }
    },
    applyRoutes = (router, routes) => {
        for (const route of routes) {
            const {method, path, handler} = route;
            try {
                (router)[method.toLowerCase()](path, handler);
            } catch (err) {
                console.error(method);
                console.error(path);
                console.error(handler);
                console.error("applyRoutes", err);
                process.exit(0);
            }
        }
    },
    getLeftSpace = (len) => len < 120 ? ' '.repeat(120 - len) : '',
    printInline = (...args) => {
        let str = args.map(o => typeof o === 'object' ? JSON.stringify(o) : o).join(' ');
        str = str + getLeftSpace(str.length);
        process.stdout.write(str + '\r');
    },
    replaceDoubleUnderscore = (s) => {
        s = s.replace(/___/gmi, '__');
        s = s && typeof s === 'string' ? s.toLowerCase().trim().replace(/[^a-zA-Z0-9_]/gmi, '') : JSON.stringify(s);
        s = s.match(/^\d/) ? '_' + s : s;

        if (s.indexOf("___") > -1)
            return replaceDoubleUnderscore(s);
        else {
            s = s.startsWith("_") ? s.substring(1) : s;
            return s.endsWith("_") ? s.replace(/_$/gmi, '') : s;
        }
    },
    removeSpecialCharacters = (t, replaceSpaceToUnderscore = true) => {
        if (t && typeof t === 'string' && t.trim() !== '') {
            t = t.replace(/[A-Z0-9]/g, l => `_${l.toLowerCase()}`);
            return replaceDoubleUnderscore(t, replaceSpaceToUnderscore);
        } else return '';
    },
    format = (request, message = '', arguments = []) => {
        let T = request.t ? request.t : i18next.t;  // i18n translate function
        // store arguments in an array
        let args = arguments;
        // use replace to iterate over the string
        // select the match and check if related argument is present
        // if yes, replace the match with the argument
        return T(message).replace(/{([0-9]+)}/g, function (match, index) {
            // check if the argument is present
            return typeof args[index] == 'undefined' ? match : args[index];
        });
    },
    HTTP_STATUS_CODE = {
        CONTINUE: 100,
        SWITCHING_PROTOCOLS: 101,
        /** OK 200 */
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        NON_AUTHORITATIVE_INFORMATION: 203,
        /** NO_CONTENT: 204 */
        NO_CONTENT: 204,
        RESET_CONTENT: 205,
        PARTIAL_CONTENT: 206,
        MULTIPLE_CHOICES: 300,
        MOVED_PERMANENTLY: 301,
        FOUND: 302,
        SEE_OTHER: 303,
        NOT_MODIFIED: 304,
        USE_PROXY: 305,
        TEMPORARY_REDIRECT: 307,

        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        PAYMENT_REQUIRED: 402,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_ALLOWED: 405,
        NOT_ACCEPTABLE: 406,
        PROXY_AUTHENTICATION_REQUIRED: 407,
        REQUEST_TIMEOUT: 408,
        CONFLICT: 409,
        GONE: 410,
        LENGTH_REQUIRED: 411,
        PRECONDITION_FAILED: 412,
        PAYLOAD_TOO_LARGE: 413,
        URI_TOO_LONG: 414,
        UNSUPPORTED_MEDIA_TYPE: 415,
        RANGE_NOT_SATISFIABLE: 416,
        EXPECTATION_FAILED: 417,
        UPGRADE_REQUIRED: 426,

        INTERNAL_SERVER_ERROR: 500,
        NOT_IMPLEMENTED: 501,
        BAD_GATEWAY: 502,
        SERVICE_UNAVAILABLE: 503,
        GATEWAY_TIMEOUT: 504,
        HTTP_VERSION_NOT_SUPPORTED: 505
    },
    R20X = (res, data, status = 200, message = null, error = null) => {
        res.status(status).json({message: message, result: data, error: error});
        return true;
    },
    R40X = (res, error = null, status = 400) => {
        const _error = error && typeof error === 'string' ? error : error && error.message ? error.message : error;
        res.status(status).json({error: _error});
        return false;
    },
    getDutySelectQueryFromJSON = (dataJSON, reqBody, isFTA = false) => {
        let colList = ['hs', 'des', 'cyn', 'ui', 'total'], refCols = [];
        colList = colList.map(col => `${reqBody.import_country}.${reqBody.import_country}_${col} as ${col}`);
        dataJSON.filter(o => !o.ref).forEach(col => {
            colList.push(...getAllDutyColumns(col.duty_code,col.duty_details_description,reqBody.import_country, reqBody.import_country));
        });
        // console.log(colList);
        // console.log(dataJSON);
        dataJSON.filter(o => o.ref).forEach(col => {
            if (!refCols.includes(col.ref)) refCols.push(col.ref);
            colList.push(...getAllDutyColumns(col.duty_code,col.duty_details_description, `${reqBody.import_country}_${col.ref}`, reqBody.import_country));
        });
        // language=SQL format=false
        if (refCols.length === 0) {
            return (`select ${colList.join()}
                 from ${reqBody.import_country}
                 where ${reqBody.import_country}.${reqBody.import_country}_hs = ${reqBody.hscode};`);
        }
        return (`select ${colList.join()}
                 from ${reqBody.import_country}
                          LEFT JOIN ${reqBody.import_country}_${refCols[0]}
                 ON ${reqBody.import_country}.${reqBody.import_country}_hs = ${reqBody.import_country}_${refCols[0]}.${reqBody.import_country}_hs
                 where ${reqBody.import_country}.${reqBody.import_country}_hs = ${reqBody.hscode};`);
    },
    getAllDutyColumns = (duty ,duty_details_description,tblName, import_country) => {
        return [`${tblName}.${import_country}_${duty}_d as ${import_country}_${duty}_d`,`'${duty_details_description}' as ${duty}_dd` ,`${tblName}.${import_country}_${duty}_f as ${import_country}_${duty}_f`, `${tblName}.${import_country}_${duty}_cl as ${import_country}_${duty}_cl`];
    },
    getCalculatedDuty = (duty, data) => {
        if (!duty) return duty;
        try {
            // console.log('duty---', duty);
            // console.log('data---', data['base_value']);
            duty = duty.replaceAll(/[a-zA-Z_]+/g, m => {
                // return req.body[m] ? `$\{req.body.${m}}` : m;
                // console.log('m',m);
                return data.hasOwnProperty(m) ? data[m] : m;
            });
            // console.log('duty2', duty);
            // return eval(eval(("`" + duty + "`")));
            return duty.includes('return') ? eval(duty)() : eval(duty);
        } catch (e) {
            console.error(e);
            return e;
            // return 'error';
        }
    },
    getDutyfromUserInput = async (req, res, userInput,basevalueref) => {
        try {
            const selectQ = getDutySelectQueryFromJSON(userInput, req.body);
            // console.log('selectQ', selectQ);
            let duty = await db.sequelize.query(selectQ, SELECT_OPTIONS).catch(e => {
                    returnError(res, 'Error: ' + e);
                }
            );
            // console.log('duty', duty);
            duty && duty.forEach(d => {
                let mfn_col = Object.keys(d).filter(o => o.includes(basevalueref.duty_code) && o.endsWith('cl'));
                mfn_col = mfn_col.length ? mfn_col[0] : null;
                let temp = d;
                if (d[mfn_col].startsWith('ref_'))
                {
                    let refKeyname = d[mfn_col].replace('ref_', '');
                    mfn_col=Object.keys(d).filter(o => o.includes(refKeyname));
                }
                Object.keys(req.body).forEach(bodyKey => temp[bodyKey] = !isNaN(req.body[bodyKey]) ? req.body[bodyKey] : 0);
                let base_value = !mfn_col ? 0 : isNaN(d[`${mfn_col}`]) ? 0 : d[`${mfn_col}`];
                base_value= getCalculatedDuty(d[mfn_col], temp); 
                temp['base_value'] = d['base_value'] = base_value;
                // console.log('base_value_mfn', temp['base_value'])
              //  d[mfn_col] = getCalculatedDuty(d[mfn_col], temp);
                Object.keys(d).forEach(key => {
                    // console.log('key', key);
                    if (key.endsWith('_cl')) {
                        if (d[key].startsWith('ref_')) {
                            let refKey = d[key].replace('ref_', '');
                            d[key] = d[refKey];
                        } else {
                            d[`${key}_formulae`] = d[key];
                            d['base_value'] = base_value;
                            // console.log('base_value', d['base_value'])
                            Object.keys(req.body).forEach(bodyKey => d[bodyKey] = !isNaN(req.body[bodyKey]) ? req.body[bodyKey] : 0);
                            d[key] = getCalculatedDuty(d[key], d);
                        }
                    }
                });
                if (d.hasOwnProperty('total')) {
                    try {
                        d['total_formulae'] = d['total'];
                        d['total'] = d['total'].replaceAll(/[a-zA-Z_]+/g, "${!temp['$&'] || isNaN(temp['$&'])?0:temp['$&']}");
                        d['total_formulae2'] = d['total'];
                        // let temp = d;
                        // Object.keys(req.body).forEach(bodyKey => temp[bodyKey] = !isNaN(req.body[bodyKey]) ? req.body[bodyKey] : 0);
                       // console.log('base_value', temp['base_value'])
                        d['total_formulae3'] = (eval(("`" + d['total'] + "`")));
                        d['total'] = eval(eval("`" + d['total'] + "`"));
                    } catch (e) {
                        d['total'] = 'error';
                        console.log(e);
                    }
                }
            });
            // duty = duty.filter(d => !d.duty_code.includes('mfn'));
            // console.log(duty);
            return (duty);
        } catch (e) {
            console.log(e);
            return('There was some error, please try again  ' + e);
        }
    }
;

module.exports = {
    middleware,
    applyRoutes,
    removeSpecialCharacters,
    format,
    printInline,
    replaceDoubleUnderscore,
    HTTP_STATUS_CODE,
    replaceDoubleUnderscore,
    R20X,
    R40X,
    getDutySelectQueryFromJSON,
    getCalculatedDuty,
    getDutyfromUserInput
}
