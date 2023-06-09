const db = require("../models");
const { getDutySelectQueryFromJSON, getCalculatedDuty } = require("../config/utils");
const { getSelectQueryFromJSON } = require("../config/utils");
const { SELECT_OPTIONS } = require("../config/CONSTANT");
const { returnData, returnError } = require("../config/db.common");

exports.getHsCode = async (req, res) => {
	const { q } = req.query;
	if (!q) return returnError(res, "Please provide a search query", 400);
	if (q && q.length < 2) return returnError(res, "Please enter at least min 2 character", 400);
	let hs_codes = await db.sequelize.query(`select * from hs_codes where product like '${q}%' or hs_code like '${q}%' order by hs_code limit 20;`, SELECT_OPTIONS);
	console.log(hs_codes.length);
	returnData(res, hs_codes);
}

exports.getHsCodeDetails = async (req, res) => {
	const { hs } = req.query;
	if (!hs) return returnError(res, "Please provide a search query", 400);
	if (hs && hs.length < 2) return returnError(res, "Please enter at least min 2 character", 400);
	const _hs = parseInt(hs);
	let _q = "";
	if (_hs) {
		if (hs.length % 2 !== 0) { return returnError(res, "Please enter 2, 4 or 6 digit hs code", 400); }
		_q = `SELECT concat(hs2,' - ',hs2_des) AS hs2, concat(hs4,' - ',hs4_des) AS hs4, concat(hs6,' - ',hs6_des) AS hs6 FROM hs_codes_details WHERE hs2 = '${hs}' OR hs4 = '${hs}' OR hs6 = '${hs}' limit 100;`;
	}
	else {
		_q = `SELECT concat(hs2,' - ',hs2_des) AS hs2, concat(hs4,' - ',hs4_des) AS hs4, concat(hs6,' - ',hs6_des) AS hs6 FROM hs_codes_details WHERE hs2_des LIKE '%${hs}%' OR hs4_des LIKE '%${hs}%' OR hs6_des LIKE '%${hs}%' limit 100;`;
	}
	let hs_codes = await db.sequelize.query(_q, SELECT_OPTIONS);
	returnData(res, hs_codes);
}

exports.getUserInput = async (req, res) => {
	const { hs, imp } = req.query;
	let data = [];
	if (!hs) return returnError(res, "Please provide a search query", 400);
	if (hs && hs.length < 2) return returnError(res, "Please enter at least min 2 character", 400);
	const _q = `SELECT ${imp}_ui FROM ${imp} WHERE ${imp}_hs = '${hs}';`;
	let hs_codes = await db.sequelize.query(_q, SELECT_OPTIONS);
	if (hs_codes.length > 0) {
		data = hs_codes[0][`${imp}_ui`];
		data = data ? JSON.parse(data) : [];
	}
	returnData(res, data);
}

exports.getProductFromCountryCode = async (req, res) => {
	const { hs, imp } = req.query;
	if (!hs) return returnError(res, "Please provide a search query", 400);
	if (hs && hs.length < 2) return returnError(res, "Please enter at least min 2 character", 400);
	const _q = `SELECT ${imp}_hs AS value, ${imp}_des AS label FROM ${imp} WHERE ${imp}_hs like '${hs}%';`;
	let hs_codes = await db.sequelize.query(_q, SELECT_OPTIONS);
	returnData(res, hs_codes);
}

exports.getCountry = async (req, res) => {
	const _q = `SELECT country_code as value, country_name as label FROM master_cyn;`;
	let country = await db.sequelize.query(_q, SELECT_OPTIONS);
	returnData(res, country);
}

exports.getCurrency = async (req, res) => {
	const _q = `SELECT country_id AS code, cyn_code AS value, cyn_name AS label FROM master_cyn;`;
	let currency = await db.sequelize.query(_q, SELECT_OPTIONS);
	returnData(res, currency);
}