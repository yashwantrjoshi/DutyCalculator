const db = require("../models");
const {getDutySelectQueryFromJSON, getCalculatedDuty} = require("../config/utils");
const {getSelectQueryFromJSON} = require("../config/utils");
const {SELECT_OPTIONS} = require("../config/CONSTANT");
const {returnData, returnError} = require("../config/db.common");

exports.getCountry = async (req, res) => {
	console.log("Inside getCountry API");
	const {q} = req.query;
	if (!q) return returnError(res, "Please provide a search query", 400);
	if (q && q.length < 2) return returnError(res, "Please enter at least min 2 character", 400);
	let hs_codes = await db.sequelize.query(`select * from hs_codes where product like '${q}%' order by hs_code limit 20;`, SELECT_OPTIONS);
	console.log(hs_codes.length);
	returnData(res, hs_codes);
}

exports.getHsCodeDetails = async (req, res) => {
	console.log("Inside getHSCodeDetails API");
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
	console.log("Inside getCountryCurrency API");
	const { imp } = req.query;
	const _q = `SELECT exp_cyn AS country, exp_cyn_code AS currency, exp_country_unit AS unit, imp_exchange_rate AS value FROM cyn where imp_cyn_id='${imp}';`;
	let currency = await db.sequelize.query(_q, SELECT_OPTIONS);
	returnData(res, currency);
}

exports.getRulesOfOrigin = async (req, res) => {
	console.log("Inside get rules of origin API");
	const { hs, imp, exp } = req.query;
	if (!hs || !imp || !exp) return returnError(res, "Please provide a search query", 400);
	const _q1 = `SELECT duty_code AS duty, rta_id AS rta from master_fta WHERE imp_country_code='${imp}' AND exp_country_code LIKE '%${exp}%';`;
	let duty_info = await db.sequelize.query(_q1, SELECT_OPTIONS);
	let _hs = hs.toString().slice(0,6);
	let rules = [];
	if(duty_info && duty_info.length) {
		for await(const d of duty_info) {
			let _q2 = `SELECT origin AS label, footnote AS value from roo WHERE hs6 = '${_hs}' AND rta_id = '${d.rta}' AND duty_code = '${d.duty}' AND fta_country LIKE '%${exp}%';`;
			let data = await db.sequelize.query(_q2, SELECT_OPTIONS);
			data && data[0] && rules.push(data[0]);
		}
	}
	returnData(res, rules);
}