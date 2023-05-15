const db = require("../models");
const {getDutySelectQueryFromJSON, getCalculatedDuty} = require("../config/utils");
const {getSelectQueryFromJSON} = require("../config/utils");
const {SELECT_OPTIONS} = require("../config/CONSTANT");
const {returnData, returnError} = require("../config/db.common");

exports.getCountry = async (req, res) => {
	const {q} = req.query;
	if (!q) return returnError(res, "Please provide a search query", 400);
	if (q && q.length < 2) return returnError(res, "Please enter at least min 2 character", 400);
	let hs_codes = await db.sequelize.query(`select * from hs_codes where product like '${q}%' order by hs_code limit 20;`, SELECT_OPTIONS);
	console.log(hs_codes.length);
	returnData(res, hs_codes);
}

exports.getHsCodeDetails = async (req, res) => {
	const {hs} = req.query;
	if (!hs) return returnError(res, "Please provide a search query", 400);
	if (hs && hs.length < 2) return returnError(res, "Please enter at least min 2 character", 400);
	const _hs = parseInt(hs);
	const _q = `SELECT * FROM hs_codes_details WHERE hs2 = '${hs}' OR hs4 = '${hs}' OR hs6 = '${hs}' OR hs2 = '${_hs}' OR hs4 = '${_hs}' OR hs6 = '${_hs}' limit 100;`;
	console.log(_q);
	let hs_codes = await db.sequelize.query(_q, SELECT_OPTIONS);
	console.log(hs_codes.length);
	returnData(res, hs_codes);
}

exports.getCountryCurrency = async (req, res) => {
	const { imp } = req.query;
	const _q = `SELECT exp_cyn AS country, exp_cyn_code AS currency, exp_country_unit AS unit, imp_exchange_rate AS value FROM cyn where imp_cyn_id='${imp}';`;
	let currency = await db.sequelize.query(_q, SELECT_OPTIONS);
	returnData(res, currency);
}
