const db = require("../models");
const { SELECT_OPTIONS } = require("./CONSTANT");
const { returnError, returnData } = require("./db.common");
const middleware = (router, middleware) => {
    for (const f of middleware) {
        f(router);
    }
},
    applyRoutes = (router, routes) => {
        for (const route of routes) {
            const { method, path, handler } = route;
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
    R20X = (res, data, status = 200, message = null, error = null) => {
        res.status(status).json({ message: message, result: data, error: error });
        return true;
    },
    R40X = (res, error = null, status = 400) => {
        const _error = error && typeof error === 'string' ? error : error && error.message ? error.message : error;
        res.status(status).json({ error: _error });
        return false;
    },
    sortInputForMode = (dutyInput, mode) => {
        let data = [];
        dutyInput && dutyInput.forEach(d => {
            if (d.mode == "all") { data.push(d); }
            else if (d.mode == mode.toLowerCase()) {
                data.push(d);
            }
        });
        return data;
    },
    getDutySelectQueryFromJSON = (dataJSON, reqBody) => {
        let colList = ['hs', 'des', 'cyn', 'ui', 'total'], refCols = [];
        colList = colList.map(col => `${reqBody.import_country}.${reqBody.import_country}_${col} as ${col}`);
        dataJSON.filter(o => !o.ref).forEach(col => {
            colList.push(...getAllDutyColumns(col.duty_code, col.duty_details_description, reqBody.import_country, reqBody.import_country));
        });
        dataJSON.filter(o => o.ref).forEach(col => {
            if (!refCols.includes(col.ref)) refCols.push(col.ref);
            colList.push(...getAllDutyColumns(col.duty_code, col.duty_details_description, `${reqBody.import_country}_${col.ref}`, reqBody.import_country));
        });
        // language=SQL format=false
        if (refCols.length === 0) {
            return (`select ${colList.join()}
                 from ${reqBody.import_country}
                 where ${reqBody.import_country}.${reqBody.import_country}_hs = "${reqBody.hscode}";`);
        }
        return (`select ${colList.join()}
                 from ${reqBody.import_country}
                          LEFT JOIN ${reqBody.import_country}_${refCols[0]}
                 ON ${reqBody.import_country}.${reqBody.import_country}_hs = ${reqBody.import_country}_${refCols[0]}.${reqBody.import_country}_hs
                 where ${reqBody.import_country}.${reqBody.import_country}_hs = "${reqBody.hscode}";`);
    },
    getAllDutyColumns = (duty, duty_details_description, tblName, import_country) => {
        return [`${tblName}.${import_country}_${duty}_d as ${import_country}_${duty}_d`, `'${duty_details_description}' as ${import_country}_${duty}_dd`, `${tblName}.${import_country}_${duty}_f as ${import_country}_${duty}_f`, `${tblName}.${import_country}_${duty}_cl as ${import_country}_${duty}_cl`];
    },

    getCalculationKey = (val, data, type = "_cl", isFTA = false) => {
        var code = val.split(type)[0];
        var valRegEx = new RegExp("^(" + code + ").?(" + type + ")$", "g");
        var key = Object.keys(data).filter(f => f.match(valRegEx));
        return key && key.length && (isFTA && key[key.length - 1] || key[0]);
    },

    checkifFunction = (key, expr, data) => {
        let regEx = new RegExp("[a-zA-Z_]+[0-9]?[a-zA-Z_]*", "g");
        return key.match(regEx) && expr.match(/^\(\(\)\s{0,2}\=\>/) ? data.hasOwnProperty(key) ? data[key] : key : 0;
    },

    getCalculatedDuty = (duty, data, isFTA = false) => {
        if (!duty) return duty;
        try {
            let regEx = new RegExp("[a-zA-Z_]+[0-9]*[a-zA-Z_]*", "g");
            let temp = duty;
            duty = duty.replaceAll(regEx, m => {
                // return req.body[m] ? `$\{req.body.${m}}` : m;
                let key = '';
                if (!data.hasOwnProperty(m)) {
                    key = getCalculationKey(m, data, "_cl", isFTA);
                }
                m = key || m;

                return data.hasOwnProperty(m) && typeof data[m] == 'string' ?
                    (data[m].match(/[\+-\/\*\%]/g) ? getCalculatedDuty(data[m], data) : data.hasOwnProperty(m) && data[m])
                    : data.hasOwnProperty(m) && data[m] ? data[m] :
                        m.toString().match(/^[0-9]+(\.[0-9]+)[0-9]*$/g) ? m : checkifFunction(m, temp, data);

            });
            // return eval(eval(("`" + duty + "`")));
            if (duty.includes('return')) {
                return eval(duty)();
            } else {
                return eval(duty);
            }
        } catch (e) {
            console.error(e);
            return e;
        }
    },
    getDutyfromUserInput = async (req, res, userInputData, basevalueref, isFTA) => {
        try {
            const selectQ = getDutySelectQueryFromJSON(userInputData, req.body);
            let duty = await db.sequelize.query(selectQ, SELECT_OPTIONS).catch(e => {
                returnError(res, 'Error: ' + e);
            }
            );
            let dutyResponse = [];
            duty && duty.forEach(d => {
                let mfn_col = Object.keys(d).filter(o => o.includes(basevalueref.duty_code) && o.endsWith('cl'));
                mfn_col = mfn_col.length ? mfn_col[0] : null;
                if (mfn_col && d[mfn_col].startsWith('ref_')) {
                    let refKeyname = d[mfn_col].replace('ref_', '');
                    mfn_col = getCalculationKey(refKeyname, d);
                }
                Object.keys(req.body).forEach(bodyKey => d[bodyKey] = req.body[bodyKey] != null ? req.body[bodyKey] : 0);
                let temp = d;
                let base_value = !mfn_col ? 0 : isNaN(d[`${mfn_col}`]) ? 0 : d[`${mfn_col}`];
                base_value = getCalculatedDuty(d[mfn_col], temp, isFTA);
                temp['base_value'] = d['base_value'] = base_value;
                //  d[mfn_col] = getCalculatedDuty(d[mfn_col], temp);

                Object.keys(d).forEach(key => {
                    if (key.match(/(_d)$/) && d[key].toLowerCase() === "n/a") {
                        let refKeyname = key.split(/(_d)$/)[0];
                        delete d[key];
                        delete d[`${refKeyname}_dd`];
                        delete d[`${refKeyname}_cl`];
                        delete d[`${refKeyname}_f`];
                    }
                });

                Object.keys(d).forEach(key => {
                    if (key.endsWith('_d')) {
                        if (d[key].startsWith('ref_')) {
                            let refKey = d[key].replace('ref_', '');
                            refKey = getCalculationKey(refKey, d, "_d");
                            d[key] = d[refKey];
                        }
                        else {
                            let dataKey = checkifFunction(key, d[key], d);
                            d[key] = dataKey && getCalculatedDuty(d[key], d, isFTA) || d[key];
                        }
                    }
                    else if (key.endsWith('_cl')) {
                        if (d[key].startsWith('ref_')) {
                            let refKey = d[key].replace('ref_', '');
                            refKey = getCalculationKey(refKey, d);
                            d[key] = d[refKey];
                        }
                        else {
                            d[`${key}_formulae`] = d[key];
                            d['base_value'] = base_value;
                            Object.keys(req.body).forEach(bodyKey => d[bodyKey] = req.body[bodyKey] != null ? req.body[bodyKey] : 0);
                            d[key] = getCalculatedDuty(d[key], d, isFTA);
                        }
                    }
                });
                if (d.hasOwnProperty('total')) {
                    try {
                        let totalTemp = d['total'];
                        totalTemp = totalTemp.replaceAll(/[a-zA-Z_]+/g, val => {
                            let key = getCalculationKey(val, d);
                            return d.hasOwnProperty(val) ? val : key && d.hasOwnProperty(key) ? key : 0;
                        });
                        d['total_formulae'] = d['total'] = totalTemp;
                        d['total'] = d['total'].replaceAll(/[a-zA-Z_]+[0-9]?[a-zA-Z_]+/g, "${!temp['$&'] || isNaN(temp['$&'])?0:temp['$&']}");
                        d['total_formulae2'] = d['total'];
                        // let temp = d;
                        // Object.keys(req.body).forEach(bodyKey => temp[bodyKey] = !isNaN(req.body[bodyKey]) ? req.body[bodyKey] : 0);
                        d['total_formulae3'] = (eval(("`" + d['total'] + "`")));
                        d['total'] = eval(eval("`" + d['total'] + "`"));
                    } catch (e) {
                        d['total'] = 'error';
                        console.log(e);
                    }
                }

                var responseData = {}, dutyDetails = [], groupedData = {}, parseData = d;
                const groupedDutyKeys = Object.keys(parseData);
                groupedDutyKeys.forEach((key) => { key.match(/(_cl|_d|_dd)$/) ? groupedData[key] = parseData[key] : responseData[key] = parseData[key]; });
                const dutyKeys = groupedDutyKeys.filter(element => element.match(/(_dd)$/));
                dutyKeys.forEach((dutyKey) => {
                    var name = dutyKey.split("_dd")[0];
                    var _cl = `${name}_cl`, _d = `${name}_d`;
                    dutyDetails.push({
                        [dutyKey]: groupedData[dutyKey],
                        [_cl]: groupedData[`${name}_cl`],
                        [_d]: groupedData[`${name}_d`]
                    })
                });
                responseData['import_country'] = req.body.import_country;
                responseData['export_country'] = req.body.export_country;
                responseData = { ...responseData, dutyDetails };
                d = responseData;
                dutyResponse.push(d);
            });
            return (dutyResponse);
        } catch (e) {
            console.log(e);
            return ('There was some error, please try again  ' + e);
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
    replaceDoubleUnderscore,
    R20X,
    R40X,
    sortInputForMode,
    getDutySelectQueryFromJSON,
    getCalculatedDuty,
    getDutyfromUserInput,
    getCalculationKey,
    checkifFunction
}
