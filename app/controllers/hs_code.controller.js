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
		_q = `SELECT concat(product,' - ',hs_code) AS hs6 FROM hs_codes WHERE product LIKE '${hs}%' limit 100;`;
	}
	else {
		_q = `SELECT concat(product,' - ',hs_code) AS hs6 FROM hs_codes WHERE hs_code LIKE '% ${hs} %' limit 100;`;
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
	let hs_codes;
	if (!hs) return returnError(res, "Please provide a search query", 400);
	if (hs && hs.length < 2) return returnError(res, "Please enter at least min 2 character", 400);
	const _q = `SELECT ${imp}_hs AS value, ${imp}_des AS label FROM ${imp} WHERE ${imp}_hs like '${hs}%';`;
	try {
		hs_codes = await db.sequelize.query(_q, SELECT_OPTIONS);
	} catch(err) {
		console.log("Error in hsn country code api ", err);
		return res.status(204).send();
	}
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

exports.hsCountrySearch = async(req, res) => {
	const { hs, imp } = req.query;
	if (!hs) return returnError(res, "Please provide a search query", 400);
	if (hs && hs.length < 2) return returnError(res, "Please enter at least min 2 character", 400);
	const _hs = parseInt(hs);
	let _q = "";
	if (_hs) {
		if (hs.length % 2 !== 0) { return returnError(res, "Please enter 2, 4 or 6 digit hs code", 400); }
		_q = `SELECT concat(${imp}_hs6,' - ', ${imp}_des) AS hs6, ${imp}_hs6 AS hsn FROM ${imp} WHERE ${imp}_hs6 LIKE '${hs}%' LIMIT 100;`;
	}
	else {
		_q = `SELECT concat(${imp}_hs6,' - ', ${imp}_des) AS hs6, ${imp}_hs6 AS hsn FROM ${imp} WHERE ${imp}_des LIKE '% ${hs} %' LIMIT 100;`;
	}
	let hs_codes = await db.sequelize.query(_q, SELECT_OPTIONS);
	returnData(res, hs_codes);
}