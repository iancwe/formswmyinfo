const express = require('express')
const app = express()
const path = require('path')
const querystring = require('querystring')
const url = require('url')
var bodyParser = require('body-parser')
const _ = require('lodash')
const Promise = require('bluebird')
const restClient = require('superagent-bluebird-promise')
// const overallCtrl = require('./controllers/overallctrl')

// Global variables
var details = []
var authApiUrl = 'https://myinfo.api.gov.sg/dev/v1/authorise' // url for authorise API
var clientId = 'MyInfo_SelfTest' // your app_id/client_id provided to you during onboarding should be in process env
var redirectUrl = 'http://localhost:3001/callback' // callback url for your application
// var redirectUrl = 'http://localhost:8000' // callback url for your application
var attributes = 'name,sex,race,nationality,dob,email,mobileno,regadd,housingtype,hdbtype,marital,edulevel,assessableincome,hanyupinyinname,aliasname,hanyupinyinaliasname,marriedname,cpfcontributions,cpfbalances' // the attributes you are retrieving for your application to fill the form
var authLevel = 'L0'// the auth level, determines the flow
// the purpose of your data retrieval
var purpose = 'demonstrating MyInfo APIs'
// client secret, just made up?
var clientSecret = 'password'

// randomly generated state
var state = '123'

// Assets folder link up
app.use(express.static(path.join(__dirname, 'assets')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Root page
app.get('/', function (req, res) {
  res.send('Hello Ian')
})

// Callback URI for MyInfo
app.get('/callback', function (req, res) {
  res.sendfile('./forms/pa/index.html')
})

// Personal Accident form
app.get('/pa', function (req, res) {
  res.sendfile('./forms/pa/index.html')
})

// Function for frontend to call backend
app.post('/getPersonData', function (req, res, next) {
  console.log('did the post request')
  console.log(req.body)
  // get variables from frontend
  var code = req.body.code
  var data
  var request

  // ****CALL TOKEN API****
  request = createTokenRequest(code)
  // Invoke asycn call
  console.log(request)
  request.buffer(true)
         .end(function (callErr, callRes) {
           console.log('do you even come here bro?')
    // copy from line 74 from index.js of my info demo
          if (callErr) {
      // ERROR
          res.jsonp({status: 'Error', msg: callErr})
          } else {
            // SUCCESSFUL
            var data = {
              body: callRes.body,
              text: callRes.text
          }
      console.log("Response from Token API:")
      console.log(JSON.stringify(data.body))

      var accessToken = data.body.access_token
      if (accessToken == undefined || accessToken == null) {
        res.jsonp({status: "ERROR", msg: "ACCESS TOKEN NOT FOUND"})
      }

      // everything ok, call person API
      console.log('Call Person API')
      // callPersonAPI(accessToken, res)
    }
  })
})

function createTokenRequest(code) {
  var cacheCtl = "no-cache";
  var contentType = "application/x-www-form-urlencoded"
  var method = "POST"

  // assemble params for Token API
  var strParams = "grant_type=authorization_code" +
    "&code=" + code +
    "&redirect_uri=" + redirectUrl +
    "&client_id=" + clientId +
    "&client_secret=" + clientSecret;
  var params = querystring.parse(strParams);


  // assemble headers for Token API
  var strHeaders = "Content-Type=" + contentType + "&Cache-Control=" + cacheCtl;
  var headers = querystring.parse(strHeaders);

  // ... ignoring authLevel checking code for subsequent tutorial

  var url = 'https://myinfo.api.gov.sg/dev/v1/token'

  var request = restClient.post(url)

  // Set headers
  if (!_.isUndefined(headers) && !_.isEmpty(headers))
    request.set(headers);

  // Set Params
  if (!_.isUndefined(params) && !_.isEmpty(params))
    request.send(params)

    console.log('i am gonna flipping send it')

  return request;
}

app.listen(3001)
