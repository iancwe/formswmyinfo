const express = require('express')
const app = express()
const path = require('path')
const querystring = require('querystring')
const url = require('url')
var bodyParser = require('body-parser')
const _ = require('lodash')
const Promise = require('bluebird')
const restClient = require('superagent-bluebird-promise')
const fs = require('fs')
const jwt = require('jsonwebtoken')
// const overallCtrl = require('./controllers/overallctrl')

// Global variables
var details = []
var authApiUrl = 'https://myinfo.api.gov.sg/dev/v1/authorise' // url for authorise API
var clientId = 'MyInfo_SelfTest' // your app_id/client_id provided to you during onboarding should be in process env
var redirectUrl = 'http://localhost:3001/callback' // callback url for your application
// var redirectUrl = 'http://localhost:8000' // callback url for your application
var personApiUrl = 'https://myinfo.api.gov.sg/dev/v1/person'
var attributes = 'name,sex,race,nationality,dob,email,mobileno,regadd,housingtype,hdbtype,marital,edulevel,assessableincome,hanyupinyinname,aliasname,hanyupinyinaliasname,marriedname,cpfcontributions,cpfbalances,occupation,relationships' // the attributes you are retrieving for your application to fill the form
var authLevel = 'L0'// the auth level, determines the flow
// the purpose of your data retrieval
var purpose = 'demonstrating MyInfo APIs'
// client secret, just made up?
var clientSecret = 'password'
var publicCertContent = './ssl/stg-auth-signing-public.pem'

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
      console.log('here!' + accessToken)
      var publicCert = './ssl/stg-auth-signing-public.pem'
      console.log('where is this shit at ? ' + publicCert)
       var decoded = jwt.verify(accessToken, fs.readFileSync(publicCert, 'utf8'), { algorithms: ['RS256'], ignoreNotBefore: true })
       console.log("Decoded Access Token:")
       console.log(JSON.stringify(decoded))
      // everything ok, call person API
      console.log('Call Person API')
      // callPersonAPI(accessToken, res)
      var uinfin = decoded.sub;
      if (uinfin == undefined || uinfin == null) {
  	    res.jsonp({status: "ERROR", msg: "UINFIN NOT FOUND"});
      }
      console.log(uinfin)
      // **** CALL PERSON API ****
var request = createPersonRequest(uinfin, accessToken);
// Invoke asynchronous call
  request
      .buffer(true)
      .end(function (callErr, callRes) {
          if (callErr) {
              res.jsonp({status: "ERROR", msg: callErr});
          } else {
              // SUCCESSFUL
              var data = {body: callRes.body, text: callRes.text};
              console.log("Response from Person API:");
              console.log(JSON.stringify(data.text));
              var personJWS = data.text;
              if (personJWS == undefined || personJWS == null) {
                  res.jsonp({status: "ERROR", msg: "PERSON DATA NOT FOUND"});
              } else {
                  console.log("Person Data (JWS): "+ personJWS);

                  var personData = personJWS;
                  // verify signature & decode JWS to get the JSON
                  console.log('publicCert is : ' + publicCertContent)
                  personData = jwt.verify(personJWS, fs.readFileSync(publicCert, 'utf8'), { algorithms: ['RS256'], ignoreNotBefore: true })
                  // personData = verifyJWS(personJWS, publicCertContent);
                  if (personData == undefined || personData == null)
                      res.jsonp({status: "ERROR", msg: "INVALID DATA OR SIGNATURE FOR PERSON DATA"})
                  personData.uinfin = uinfin; // add the uinfin into the data to display on screen

                  console.log("Person Data (Decoded): " + JSON.stringify(personData))
                  // successful. return data back to frontend
                  res.jsonp({status: "OK", text: personData})
                  // donezos with this tutorial 2 just to prefill the form
              }
          }
      });

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

// function to prepare request for PERSON API
function createPersonRequest (uinfin, validToken) {
    var url = personApiUrl+ "/" + uinfin + "/"
    var cacheCtl = "no-cache";
    var method = "GET";

    // assemble params for Person API
    var strParams = "client_id=" + clientId
				+ "&attributes=" + attributes;
    var params = querystring.parse(strParams)

    // assemble headers for Person API
    var strHeaders = "Cache-Control=" + cacheCtl
    var headers = querystring.parse(strHeaders)

    // Add Authorisation headers for connecting to API Gateway
    var authHeaders = generateAuthorizationHeader(
    	url,
    	params,
    	method,
    	"", // no content type needed for GET
    	authLevel,
    	clientId,
    	clientSecret
    	);

    // NOTE: include access token in Authorization header as "Bearer " (with space behind)
    if(!_.isEmpty(authHeaders)) {
        _.set(headers, "Authorization", authHeaders + ",Bearer " + validToken);
    } else {
        _.set(headers, "Authorization", "Bearer " + validToken);
    }

	// invoke token API
    var request = restClient.get(url);

    // Set headers
    if(!_.isUndefined(headers) && !_.isEmpty(headers))
    	request.set(headers);

    // Set Params
    if(!_.isUndefined(params) && !_.isEmpty(params))
        request.query(params);

        console.log('CLAP CLAP CLAP')
        console.log(request)

	return request
}

function generateAuthorizationHeader (url, params, method, strContentType, authType) {
    // NOTE: need to include the ".e." in order for the security authorisation header to work
    url = _.replace(url, ".api.gov.sg", ".e.api.gov.sg");

	if (authType == "L2") {
        return generateSHA256withRSAHeader(url, params, method, strContentType);
    } else {
        return "";
    }

};

app.listen(3001)
