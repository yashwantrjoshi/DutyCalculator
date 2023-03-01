const users = require('./user.routes'),
	dutyCalculator = require('./duty_calculator.routes'),
	hsCodes = require('./hscodes.routes'),
	country = require('./country.routes');

module.exports = [
	{
		path: "/robots.txt", method: "get", handler: (req, res) => {
			res.type('text/plain');
			res.send("User-agent: *\nDisallow: /");
		}
	},
	...users,
	...dutyCalculator,
	...hsCodes,
	...country
];
