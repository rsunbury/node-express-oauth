const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const { timeout } = require("./utils")
const jwt = require('jsonwebtoken');

const config = {
	port: 9002,
	publicKey: fs.readFileSync("assets/public_key.pem"),
}

const users = {
	user1: {
		username: "user1",
		name: "User 1",
		date_of_birth: "7th October 1990",
		weight: 57,
	},
	john: {
		username: "john",
		name: "John Appleseed",
		date_of_birth: "12th September 1998",
		weight: 87,
	},
}

const app = express()
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/

app.get('/user-info', (req, res) => {
	const authToken = req.headers.authorization;
	let verified;
	let result = {};
	if (!authToken) return res.sendStatus(401);
	const token = authToken.slice('bearer '.length);
	try {
		verified = jwt.verify(token, config.publicKey, { algorithms: ['RS256']});
	} catch (e) {
		res.sendStatus(401);
	}

	if (verified?.scope) {
		result = verified.scope.split(' ').reduce((acc, e) => {
			const prop = e.slice('permission:'.length);
			if (users[verified.userName]?.[prop]) {
				acc[prop] = users[verified.userName][prop];
			}
			return acc;
		}, {});
	}

	res.json(result);
})

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes
module.exports = {
	app,
	server,
}
