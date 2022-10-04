const fs = require("fs")
const url = require('url')
const express = require("express")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const {
	randomString,
	containsAll,
	decodeAuthCredentials,
	timeout,
} = require("./utils")
const { request } = require('express');

const config = {
	port: 9001,
	privateKey: fs.readFileSync("assets/private_key.pem"),

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
}

const clients = {
	"my-client": {
		name: "Sample Client",
		clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
		scopes: ["permission:name", "permission:date_of_birth"],
	},
	"test-client": {
		name: "Test Client",
		clientSecret: "TestSecret",
		scopes: ["permission:name"],
	},
}

const users = {
	user1: "password1",
	john: "appleseed",
}

const requests = {}
const authorizationCodes = {}

let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/authorization-server")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/

app.get('/authorize', (req, res) => {
	const user = req?.query?.client_id;
	const scopesIn = req?.query?.scope?.split(" ");
	const myRandomString = randomString();

	if (!user || !clients[user])  res.sendStatus(401);
	if (!containsAll(clients[user].scopes, scopesIn)) res.sendStatus(401);

	requests[myRandomString] = req.query;

	res.render('login', { client: clients[user], scope: req.query.scope, requestId: myRandomString});

})

app.post('/approve', (req, res) => {
	const { userName, password, requestId} = req.body;
	let requestIdObj;
	const authKey = randomString();

	if(userName &&
		 users[userName] &&
		 password &&
		 users[userName] === password &&
	   requests[requestId]) {
		requestIdObj = requests[requestId];
		authorizationCodes[authKey] = { clientReq: requestIdObj, userName }
		res.redirect(url.format({
			pathname: requests[requestId].redirect_uri,
			query: {
				"code": authKey,
				"state": requests[requestId].state,
			}
		}));
	} else {
		res.sendStatus(401);
	}
})

app.post('/token', (req, res) => {
	let creds;
	let obj;
	if (!req.headers.authorization) res.sendStatus(401);
	creds = decodeAuthCredentials(req.headers.authorization);
	if (!clients[creds.clientId] || clients[creds.clientId].clientSecret !== creds.clientSecret) res.sendStatus(401);
	if (!req?.body?.code || !authorizationCodes[req.body.code]) res.sendStatus(401);
	obj = authorizationCodes[req.body.code];
	delete authorizationCodes[req.body.code];
	res.end();
})

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes

module.exports = { app, requests, authorizationCodes, server }
