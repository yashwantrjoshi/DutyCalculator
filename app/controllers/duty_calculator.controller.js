const db = require("../models");
const {getDutySelectQueryFromJSON, getCalculatedDuty, getDutyfromUserInput} = require("../config/utils");
const {getSelectQueryFromJSON} = require("../config/utils");
const {SELECT_OPTIONS} = require("../config/CONSTANT");
const {returnData, returnError} = require("../config/db.common");


/*Controller Start */
exports.getUserInput = async (req, res) => {
    if (!req.body.hscode || !req.body.export_country)
        returnError(res, 'Invalid Input');
    let userInput = await db.sequelize.query(`SELECT duty_code
                                              FROM master_duty_details
                                              WHERE exp_country_code = '${req.body.export_country}';`, SELECT_OPTIONS);
    if (userInput && userInput.length) {
        let ui = await db.sequelize.query(`SELECT ${req.body.export_country}_cyn,${req.body.export_country}_hs6, ${req.body.export_country}_ui
                                           FROM ${req.body.export_country}
                                           where ${req.body.export_country}_hs like '%${req.body.hscode}%'; `, SELECT_OPTIONS);
        returnData(res, ui);
    }
    returnError(res, 'No data, please check the input');
}
exports.getDuty = async (req, res) => {
    if (!req.body.hscode || !req.body.import_country || !req.body.export_country)
        returnError(res, 'Invalid Input');
    let userInput = await db.sequelize.query(`SELECT duty_code, duty_details_description, remarks, ref
                                              FROM master_duty_details
                                              WHERE imp_country_code = '${req.body.import_country}'
                                                AND (exp_country_code LIKE '%${req.body.export_country}%'
                                                  OR exp_country_code = 'all')`, SELECT_OPTIONS);
    // console.log('userInput', userInput);
    if (userInput && userInput.length) {
        try {
            const selectQ = getDutySelectQueryFromJSON(userInput, req.body);
            // console.log('selectQ', selectQ);
            let duty = await db.sequelize.query(selectQ, SELECT_OPTIONS).catch(e => {
                    returnError(res, 'Error: ' + e);
                }
            );
            // console.log('duty', duty);
            duty && duty.forEach(d => {
                let mfn_col = Object.keys(d).filter(o => o.includes('mfn') && o.endsWith('cl'));
                mfn_col = mfn_col.length ? mfn_col[0] : null;
                let temp = d;
                Object.keys(req.body).forEach(bodyKey => temp[bodyKey] = !isNaN(req.body[bodyKey]) ? req.body[bodyKey] : 0);
                let base_value = !mfn_col ? 0 : isNaN(d[`${mfn_col}`]) ? 0 : d[`${mfn_col}`];
                base_value=getCalculatedDuty(d[mfn_col], temp);
                temp['base_value'] = d['base_value'] = base_value;
                // console.log('base_value_mfn', temp['base_value'])
               // d[mfn_col] = getCalculatedDuty(d[mfn_col], temp);
                Object.keys(d).forEach(key => {
                    // console.log('key', key);
                    if (key.endsWith('_cl')) {
                        d[`${key}_formulae`] = d[key];
                        d['base_value'] = base_value;
                        // console.log('base_value', d['base_value'])
                        Object.keys(req.body).forEach(bodyKey => d[bodyKey] = !isNaN(req.body[bodyKey]) ? req.body[bodyKey] : 0);
                        d[key] = getCalculatedDuty(d[key], d);
                    }
                });
                if (d.hasOwnProperty('total')) {
                    try {
                        d['total_formulae'] = d['total'];
                        d['total'] = d['total'].replaceAll(/[a-zA-Z_]+/g, "${!temp['$&'] || isNaN(temp['$&'])?0:temp['$&']}");
                        d['total_formulae2'] = d['total'];
                        // let temp = d;
                        // Object.keys(req.body).forEach(bodyKey => temp[bodyKey] = !isNaN(req.body[bodyKey]) ? req.body[bodyKey] : 0);
                        //console.log('base_value', temp['base_value'])
                        d['total_formulae3'] = (eval(("`" + d['total'] + "`")));
                        d['total'] = eval(eval("`" + d['total'] + "`"));
                    } catch (e) {
                        d['total'] = 'error';
                        console.log(e);
                    }
                }
            });
            var responseData = {}, dutyDetails = [], groupedData = {}, parseData = duty[0];
            const groupedDutyKeys = Object.keys(parseData);
            groupedDutyKeys.forEach((key) => { key.match(/(_cl|_d|_dd)$/) ? groupedData[key] = parseData[key] : responseData[key] = parseData[key]; } );
            const dutyKeys = groupedDutyKeys.filter(element => element.match(/(_dd)$/));
            dutyKeys.forEach((dutyKey) => {
                var name = dutyKey.split("_dd")[0];
                var _cl = `${name}_cl`, _d=`${name}_d`;
                dutyDetails.push({
                    [dutyKey] : groupedData[dutyKey],
                    [_cl] : groupedData[`${name}_cl`],
                    [_d] : groupedData[`${name}_d`]
                })
            });
            responseData['import_country'] = req.body.import_country;
            responseData['export_country'] = req.body.export_country;
            responseData = { ...responseData, dutyDetails};
            returnData(res, responseData);
        } catch (e) {
            console.log(e);
            returnError(res, 'There was some error, please try again  ' + e);
        }
    }
    returnError(res, 'No data, please check the input');
}
exports.getFTA = async (req, res) => {
    if (!req.body.hscode || !req.body.import_country || !req.body.export_country)
        returnError(res, 'Invalid Input');
    let userInput = await db.sequelize.query(`SELECT duty_code, duty_details_description, remarks, ref
                                              FROM master_duty_details
                                              WHERE imp_country_code = '${req.body.import_country}'
                                                AND (exp_country_code LIKE '%${req.body.export_country}%'
                                                  OR exp_country_code = 'all')`, SELECT_OPTIONS);
    let mfnCol = userInput.filter(k => k.duty_code.includes('mfn'));
    let mfnInput = null;
    if (mfnCol.length > 0) {
        mfnInput = await db.sequelize.query(`SELECT duty_code, duty_details_description
                                             FROM master_fta
                                             WHERE exp_country_code like '%${req.body.export_country}%'
                                               AND (imp_country_code LIKE '%${req.body.import_country}%' OR imp_country_code = 'all')`, SELECT_OPTIONS);
        // userInput = userInput.filter(k => !k.duty_code.includes('mfn'));
        // userInput.push(...mfnInput);
        
    }
    let returnDataa = [];
    if (userInput && userInput.length) {
        for(input of mfnInput) {
            let userInputTemp = userInput;
            userInputTemp.push(input);
            returnDataa.push(await getDutyfromUserInput(req, res, userInputTemp,input));
        };
    }
    returnData(res, returnDataa);
    returnError(res, 'No data, please check the input');
}
