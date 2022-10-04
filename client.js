const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios").default
const { randomString, timeout } = require("./utils")
const url = require('url');

const config = {
  port: 9000,

  clientId: "my-client",
  clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
  redirectUri: "http://localhost:9000/callback",

  authorizationEndpoint: "http://localhost:9001/authorize",
  tokenEndpoint: "http://localhost:9001/token",
  userInfoEndpoint: "http://localhost:9002/user-info",
}
let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/client")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get('/authorize', (req, res) => {
  state = randomString();
  res.redirect(url.format({
    pathname: config.authorizationEndpoint,
    query: {
      "response_type": 'code',
      "client_id": config.clientId,
      "redirect_uri": config.redirectUri,
      scope: "permission:name permission:date_of_birth",
      state,
    }
  }));
  res.end();
})

app.get('/callback', (req, res) => {
  if (!req?.query?.state || req.query.state !== state) res.sendStatus(403);
  axios({
    method: 'post',
    url: config.tokenEndpoint,
    auth: {
      username: config.clientId,
      password: config.clientSecret,
    },
    data: {
      code: req.query.code,
    },
  })
    .then((result) => {
      return axios({
        method: 'get',
        url: config.userInfoEndpoint,
        headers: {
          authorization: `bearer ${result.data.access_token}`,
        },
      })
    })
    .then((result) => {
      res.end();
    })
    .catch(e => console.log(e))
})

const server = app.listen(config.port, "localhost", function () {
  let host = server.address().address
  let port = server.address().port
})

// for testing purposes

module.exports = {
  app,
  server,
  getState() {
    return state
  },
  setState(s) {
    state = s
  },
}
