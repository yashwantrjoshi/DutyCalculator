const db = require("../models");
const {QueryTypes} = require("sequelize");
const moment = require("moment");
const {HTTP_STATUS_CODE, dbOptions, dbOptionsWithLogging} = require("./utils");

const Internal = {
    isNumeric: (num) => !isNaN(num),
    isBoolean: (bool) => {
        if (bool.toLowerCase() === 'true') return true;
        if (bool.toLowerCase() === 'false') return false;
    },
}
const
    /**
     * @brief The default value for the maximum number of iterations.
     * @param req
     * @param res
     * @param next
     * @deprecated Not in use anymore.
     */
    cors = (req, res, next) => {
        const whitelist = process.env.BASE_URL + process.env.WHITELIST ? process.env.WHITELIST : 'http://localhost:3000,http://localhost:3001',
            allowedDomains = whitelist.split(","),
            origin = req.headers.origin;

        if (allowedDomains.indexOf(origin) > -1) res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
        res.setHeader('Access-Control-Allow-Credentials', true);
        next();
    },
    getPagination = (page = 0, size = 50, isForce = false) => {
        size = parseInt(size);
        page = parseInt(page);
        size = size < 1 ? 50 : (isForce ? size : ((size > 100) ? 100 : size));
        page = page < 0 ? 0 : page;
        const limit = size ? size : 50;
        const offset = ((page) * limit);
        const from = ((page) * limit);
        return {page, size, limit, offset, from};
    },
    toSafeEdit = (item, removeKeys = []) => {
        removeKeys = removeKeys.concat(['cby', 'sys_name']);
        removeKeys.forEach(key => {
            try {
                if (item[key]) delete item[key];
            } catch (e) {
                console.error(e);
            }
        });
        return item;
    },
    returnPagingData = (res, data, page, limit, extra = {}) => {
        const {count, rows} = data,
            currentPage = page ? +page : 0,
            totalPages = Math.ceil(count / limit);
        let final_json = {count, totalPages, currentPage, data: rows, ...extra};
        typeof res === 'function' ? res(final_json) : res.send(final_json);
    },
    returnError = (res, err, errorCode = 500) => {
        if (res.headersSent) return true;
        let message = err;
        if (typeof err === "string") message = {message: err};
        if (err.message) message = {message: err.message};
        if (!err) message = {message: "Some error occurred while retrieving.."};
        if (res && typeof res === 'function') {
            res({errorCode, data: message});
        } else if (res) {
            res.status(errorCode).send(message);
            return true;
        } else {
            //console.log("res is null", errorCode, err);
        }
    },
    returnData = (res, data, code = 200) => {
        if (res.headersSent)
            return true;
        if (res && data === null)
            res.status(HTTP_STATUS_CODE.NO_CONTENT).send('No data');
        else if (res && typeof res === 'function') {
            res({code, data: data});
        } else if (res) {
            const _obj = Object.prototype.toString.call(data);
            if (_obj === '[object Array]' && data.length === 0) {
                code = HTTP_STATUS_CODE.NO_CONTENT;
            } else if (_obj === '[object Object]' && JSON.stringify(data) === "{}") {
                code = HTTP_STATUS_CODE.NO_CONTENT;
            }
            // console.log("returnData", code, data);
            res.status(code).send(data);
            return true;
        } else {
            //console.log("res is null", data);
        }
    },
    validateBodyParams = (req, fieldList = [], shouldIdNull = false) => {
        const validParamsList = fieldList.map(o => o.sys_name);
        //console.log("validParamsList=-=-=-=-=-", validParamsList);
        // if (!validParamsList.includes("id")) validParamsList.push("id");
        // if (!validParamsList.includes("external_id")) validParamsList.push("external_id");
        const body = req.body;
        let validParams = {};
        let invalidParams = [];
        return new Promise((resolve) => {
            let hasName = false;
            try {
                const bodyArr = Object.keys(body);
                // if (!body.hasOwnProperty('id')) {
                validParams['id'] = shouldIdNull ? null : body['id'] ? body['id'] : body["hs_object_id"] ? body["hs_object_id"] : body["external_id"] ? body['external_id'] : null;
                // }
                if (body.hasOwnProperty('hs_object_id')) {
                    validParams["external_id"] = body["hs_object_id"] ? body["hs_object_id"] : body["id"];
                    // validParams["id"] = body["hs_object_id"] ? body["hs_object_id"] : body["id"];
                }

                /** If body does not contain name */
                //console.log("bodyArr raw==", bodyArr);
                //console.log("body raw==", body);
                //console.log("body name==", body.hasOwnProperty('name'));
                hasName = false;
                if(validParamsList.length > 0 && validParamsList.filter(o => o === 'name').length > 0) {
                    hasName = true;
                }

                if(body.hasOwnProperty('name') && bodyArr.filter(o => o === 'name').length > 0) {
                    hasName = true;
                    // console.log("hasName check==", hasName);
                }

                bodyArr.forEach((param, idx) => {
                    // if(!validParams.hasOwnProperty(param)) return;
                    // if(validParams.hasOwnProperty(param) && !validParams[param]) return;
                    // if () {
                    //     return;
                    // }
                    //console.log("loop check ",hasName, param, validParamsList.indexOf(param) > -1 && !body[param]);
                    if (validParamsList.indexOf(param) > -1 && !hasName && param === "name" && !body[param]) {
                        //console.log("loop check pass");
                        hasName = true;
                    }
                    if (validParamsList.indexOf(param) > -1 && (param !== 'external_id' && param !== 'id')) {
                        try {
                            if (body[param] && typeof body[param] === "string" && ["Invalid date", "null"].indexOf(validParams[param]) > -1) body[param] = null;

                            if (fieldList.filter(o => o.sys_name === param)[0].object_db_field_type === 'float') {
                                validParams[param] = !body[param] ? 0 : typeof (body[param]) === 'string' ? parseFloat(body[param].replace(/[^0-9\.]+/g, "")) : body[param];
                            } else if (fieldList.filter(o => o.sys_name === param)[0].object_db_field_type === 'date') {
                                // console.log("Type = date\t",'field=',body[param],"valueType=", typeof body[param],"\t","value=", body[param]);
                                validParams[param] = body[param] ? moment(body[param]).format("YYYY-MM-DD HH:mm:ssZZ") : moment().format("YYYY-MM-DD HH:mm:ssZZ");
                            } else if (fieldList.filter(o => o.sys_name === param)[0].object_db_field_type === 'boolean') {
                                validParams[param] = (body[param] === "true" || body[param] === "on" || body[param] === "1");
                            } else {
                                validParams[param] = body[param];
                            }
                        } catch (e) {
                            console.error('db-common-91', e);
                        }
                    } else if (param !== 'external_id' || param !== 'id') {
                        const temp = {};
                        temp[param] = body[param];
                        invalidParams.push(temp);
                    }
                    if (idx === bodyArr.length - 1) {
                        if (validParams.hasOwnProperty('id') && !validParams['id']) delete validParams['id'];
                        //console.log("hasName=hasName=", hasName);
                        if(validParamsList && validParamsList.length){
                            if(!hasName && validParamsList.indexOf('name') > -1){
                                validParams['name'] = "";
                            }
                        }
                        resolve({validParams, invalidParams, hasName});
                    }
                });
            } catch (e) {
                console.error(e);
                resolve({validParams, invalidParams, hasName});
            }
        });
    },
    Query = {
        runnerSelect: (db, _org_id, _object, _fields = [], _where = '') => {
            const selectFields = _fields && _fields.length > 0 && typeof _fields === "object" ? _fields.map(o => o.sys_name) : "*";
            const fields = selectFields && selectFields.length > 0 && typeof selectFields === "object" ? selectFields.map(value => `"${value}"`).join() : "*";
            return new Promise(resolve => {
                const _query = `select ${fields} from "${_org_id}".${_object} ${_where};`;
                //console.log("Query runnerSelect==", _query);
                db.sequelize.query(_query, dbOptionsWithLogging).then(rows => {
                    if (rows && rows.length > 0 && rows[0].length > 0) resolve(rows[0][rows[0].length - 1]);
                    else if (rows && rows.length > 0) resolve(rows[rows.length - 1]);
                    else resolve(null);
                }).catch((e) => {
                    console.error('169 Query > runnerSelect 001', e);
                    resolve(e);
                });
            });
        },
        runnerInsert: (db, _query, _values, _key, _options) => {
            return new Promise(resolve => {
                let options = {replacements: _values, ignoreDuplicates: false, type: QueryTypes.INSERT, returning: true, raw: true, ..._options};
                // let options = {replacements: _values, ignoreDuplicates: false, type: QueryTypes.INSERT, returning: true, raw: true, logging: (str) => console.log(str), ..._options};
                db.sequelize.query(_query, options).then(rows => {
                    resolve(rows[0]);
                }).catch((e) => resolve(e));
            });
        },
        runnerUpdate: (db, _query) => {
            return new Promise(resolve => {
                db.sequelize.query(_query, {type: QueryTypes.UPDATE, returning: true}).then(rows => {
                    resolve(rows);
                }).catch((e) => {
                    let error = e.parent;
                    if (error.file) delete error.file;
                    if (error.sql) delete error.sql;
                    error.ref = "https://www.postgresql.org/docs/current/errcodes-appendix.html";
                    resolve(error)
                });
            });
        },
        runnerDelete: (db, _query) => {
            return new Promise(resolve => {
                db.sequelize.query(_query, {type: QueryTypes.DELETE}).then(rows => {
                    resolve("success");
                }).catch((e) => {
                    console.error(e);
                    let error = e.parent;
                    if (error.file) delete error.file;
                    if (error.sql) delete error.sql;
                    error.ref = "https://www.postgresql.org/docs/current/errcodes-appendix.html";
                    resolve(error)
                });
            });
        },
        updateNameJson: (db, schemaName = "public", objectName, jsonArr) => {
            return new Promise(resolve => {
                const json = jsonArr && jsonArr.length > 0 ? jsonArr[jsonArr.length - 1] : jsonArr;
                if (json && json.hasOwnProperty('name') && !json.name) {
                    Query.runnerSelect(db, "public", "objects", [{sys_name: "code"}], ` where sys_name = '${objectName}' `).then(row => {
                        let leadZero = "";
                        if (7 > (json?.serial_key + "").length) leadZero = "0".repeat(7 - (json?.serial_key + "").length);
                        const finalSerialKey = row.code + "-" + leadZero + json?.serial_key;
                        //console.log("finalSerialKey = ", finalSerialKey);
                        const Q = `UPDATE "${schemaName}".${objectName} SET name = '${finalSerialKey}' WHERE id = '${json.id}';`
                        //console.log("updateNameJson = ", Q);
                        Query.runnerUpdate(db, Q).then((result) => {
                            jsonArr[jsonArr.length - 1].name = finalSerialKey;
                            resolve(jsonArr);
                        }).catch(e1 => {
                            console.error("e1",e1);
                            resolve(jsonArr);
                        });
                    }).catch(e => {
                        console.error("252e",e);
                        resolve(jsonArr);
                    });
                } else {
                    // console.log("name is already defined");
                    resolve(jsonArr);
                }
            });
        },
        insertFromJson: (schemaName = "public", objectName, json) => {
            const keys = Object.keys(json);
            let query = `INSERT INTO "${schemaName}".${objectName} ("${keys.join('","')}") VALUES `;
            let values = [];
            let update = [];
            keys.forEach(key => {
                // if (Internal.isNumeric(json[key])) values.push(`${json[key]}`);
                // else if (Internal.isBoolean(json[key])) values.push(`${json[key]}`);
                // else values.push(`'${json[key]}'`);
                values.push(`${json[key]}`);
                if (json[key] !== null) update.push(`"${key}" = '${json[key]}'`);
            });
            let ret = ', "serial_key"';
            if (keys.indexOf("serial_key") > -1) {
                ret = "";
            }
            query += `(${values.map(() => '?').join(",")}) ON CONFLICT ("id") DO UPDATE SET ${update.toString()} RETURNING id ${ret},"${keys.join('","')}"`;
            // query += `(${values.map(() => '?').join(",")});`;
            return {_query: query, _values: values, _key: keys.map(o => '"' + o + '"')};
        },
        updateFromJson: (schemaName = "public", objectName, json, id) => {
            const keys = Object.keys(json);
            let query = `UPDATE "${schemaName}"."${objectName}"
                         SET `;
            let values = [];
            keys.forEach(key => {
                let value = json[key] === null ? json[key] : `'${json[key]}'`;
                values.push(`"${key}" = ${value}`);
            });
            query += `${values.join(",")} where id = '${id}';`;
            return query;
        },
        getByID: async (db, org_id = "public", object_sys_name, id) => {
            if(!id) return null;
            const Q = `select * from ${org_id}.${object_sys_name} where id = '${id}'`;
            return await db.sequelize.query(Q, {type: QueryTypes.SELECT});
        }
    },
    SyncFromTo = {
        quote: (db, org_id, object_sys_name, result) => {
            return new Promise(resolve => {
                //console.log("object_sys_name", object_sys_name);
                if (object_sys_name === "line_item") {
                    //console.log("result", result);
                    const res = result[0];
                    const options = {returning: true, raw: true/*, logging: (str) => console.log(str)*/};
                    const queryProduct = `select *
                                          from "${org_id}".product
                                          where hs_object_id = '${res.hs_product_id}';`;
                    const queryQuote = `select *
                                        from "${org_id}".quote
                                        where id = '${res.associatedquoteid}';`;

                    db.objectFields._getAllSysObjectField(org_id, "line_item").then(validFields => {
                        db.sequelize.query(queryProduct, options).then(queryProductArray => {
                            // console.info("queryProductArray\n", queryProductArray);
                            validateBodyParams(queryProductArray[0], validFields).then(({validParams, invalidParams, hasName}) => {
                                let updateQ = Query.updateFromJson(org_id, "line_item", validParams, res.id);
                                //console.log("updateQ", updateQ);
                                // db.sequelize.query(updateQ, options).then(queryQuoteArray => {
                                // db.sequelize.query(queryQuote, options).then(queryQuoteArray => {
                                //     validateBodyParams(queryQuoteArray[0], validFields).then(({validParams, invalidParams, hasName}) => {
                                //         Query.updateFromJson(org_id, "line_item", validParams, res.id).then(result => {
                                //             console.log(org_id, object_sys_name, res);
                                resolve(result);
                                // });
                                // });
                                // });
                                // });
                            });
                        });
                    });
                }
                resolve(result);
            });
        }
    };

module.exports = {
    cors,
    toSafeEdit,
    getPagination,
    returnPagingData,
    returnError,
    returnData,
    validateBodyParams,
    Query,
    SyncFromTo
};
