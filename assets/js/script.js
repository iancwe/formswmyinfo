$(document).ready(function () {
  // global variables
  var authApiUrl = 'https://myinfo.api.gov.sg/dev/v1/authorise' // url for authorise API
  var clientId = 'MyInfo_SelfTest' // your app_id/client_id provided to you during onboarding should be in process env
  var redirectUrl = 'http://localhost:3001/callback' // callback url for your application
  // var redirectUrl = 'http://localhost:8000' // callback url for your application
  var attributes = 'name,sex,race,nationality,dob,email,mobileno,regadd,housingtype,hdbtype,marital,edulevel,assessableincome,hanyupinyinname,aliasname,hanyupinyinaliasname,marriedname,cpfcontributions,cpfbalances,occupation,relationships' // the attributes you are retrieving for your application to fill the form
  // var authLevel = 'L0'// the auth level, determines the flow
  // the purpose of your data retrieval
  var purpose = 'demonstrating MyInfo APIs'

  // randomly generated state
  var state = '123'
  console.log('jQuery up and running')

  // get API call from main server
  $.ajax({
    // invoke API call to get the clientId & redirectURL from serverside
    url: '/callback',
    data: {
    },
    type: 'GET', // GET from serverside
    success: function (data) {
      // successful response from serverside
      if (data.status === 'OK') { // successful
        clientId = data.clientId
  			redirectUrl = data.redirectUrl
  			authApiUrl = data.authApiUrl
  			attributes = data.attributes
  			authLevel = data.authLevel
        // Fill up application form with data
        console.log('Success for tutorial 2:', data)
      } else {
        // Error occured
        // alert('ERROR:' + JSON.stringify(data.msg))
      }
    }
  })

  // CALLBACK HANDLER
  if (this.location.href.indexOf('callback') > -1) {
    // call the backend server APIs tutorial 2 part 3
    callServerAPIs()
  }

  // Function for calling server side APIS (token & person) to get the person data for prefilling form
  function callServerAPIs () {
    var urlwcode = encodeURI(this.location.href)
    urlwcode = urlwcode.split('?')
    urlwcode = urlwcode[1].split('&')
    var authCode = urlwcode[0].split('=')[1]
    console.log(authCode)
    // alert ('authorisation code ='+authCode)
    console.log('called it');

    // Invoke AJAX call from frontend clientside to your backend serverside
      $.ajax({
        url: '/getPersonData',
        data: {
          code: authCode,
        },
        type: 'POST', // post to serverside
        success: function (data) {
          // successful response from serverside
          if (data.status == 'OK') { // successful
            // fill up the application form
            alert('WORKED')
            console.log(data.text)
            prefillForm(data.text)
          } else {
            // error occured
            alert('Error:'+JSON.stringify(data.msg))
          }
        }
      })
  }

  // prefill in form with url anchor
  var hashParams = window.location.hash.substr(1).split('&')
  for (var i = 0; i < hashParams.length; i++) {
    var fieldsValue = hashParams[i].split('=')
    if (fieldsValue[0] === 'first_name') {
      document.getElementById('entry_334896794').value = decodeURIComponent(fieldsValue[1])
    } else if (fieldsValue[0] === 'last_name') {
      document.getElementById('entry_894202027').value = decodeURIComponent(fieldsValue[1])
    } else if (fieldsValue[0] === 'email') {
      document.getElementById('entry_1302158345').value = decodeURIComponent(fieldsValue[1])
    }
  }

  // When user click on retrieve myinfo button (sends out an api, api 1-Authorise)
  $('#myInfo').click(function(){
    callAuthoriseApi()
  })

  function callAuthoriseApi () {
    var authoriseUrl = authApiUrl + '?client_id=' + clientId + '&attributes=' + attributes + '&purpose=' + purpose + '&state=' + state + '&redirect_uri=' + redirectUrl

    // console.log(authoriseUrl)
    window.location = authoriseUrl
  }

  // Sending API call to myinfo to test tutorial 1
  // $.ajax({
  //   type: 'GET',
  //   url: 'https://myinfo.api.gov.sg/dev/L0/v1/person/S9203266C/',
  //   datatype: 'json',
  //   success: function (details) {
  //     console.log('Success for tutorial 1', details)
  //     var nationality = details.nationality.value
  //     document.getElementById('entry_845436144').value = nationality
  //     var marital = details.marital.value
  //     document.getElementById('entry_1666814391').value = marital
  //     var dob = details.dob.value
  //     document.getElementById('entry_1628080810').value = dob
  //     var nric = 'S9203266C'
  //     document.getElementById('entry_1172287282').value = nric
  //     var gender = details.sex.value
  //     // figuring out how to prefill radio buttons
  //     var address1 = details.regadd.block + ' ' + details.regadd.street
  //     document.getElementById('entry_303748046').value = address1
  //     var address2 = '#' + details.regadd.floor + '-' + details.regadd.unit
  //     document.getElementById('entry_1490315281').value = address2
  //     var postal = details.regadd.postal
  //     document.getElementById('entry_1781395245').value = postal
  //     var income = details.assessableincome.value
  //     document.getElementById('entry_1306415138').value = income
  //   },
  //   error: function (error) {
  //     console.log('ERROR', error)
  //   }
  // })

  function prefillForm (details) {
    var surname = details.name.value.split(' ')[0]
    document.getElementById('entry_894202027').value = surname
    // var given = details.name.value.split(' ')[1].concat(details.name.value.split(' ')[2])
    var given = details.name.value.split(' ')[1] + ' ' + (details.name.value.split(' ')[2])
    document.getElementById('entry_334896794').value = given
    var nationality = details.nationality.value
    if (nationality === 'SG') {
      nationality = 'Singaporean'
    }
    document.getElementById('entry_845436144').value = nationality
    var marital = details.marital.value
    if (marital == '1') {
      marital = 'Single'
    } else if (marital == '2') {
      marital = 'Married'
    } else if (marital == '3') {
      marital = 'Widowed'
    } else {
      marital = 'Divorced'
    }
    document.getElementById('entry_1666814391').value = marital
    var dob = details.dob.value
    document.getElementById('entry_1628080810').value = dob
    var nric = 'S9203266C'
    document.getElementById('entry_1172287282').value = nric
    var gender = details.sex.value
    if (gender === 'M') {
      document.getElementById('group_696362694_1').setAttribute('checked', 'checked')
    } else if (gender === 'F') {
      document.getElementById('group_696362694_2').setAttribute('checked', 'checked')
    }
    // figuring out how to prefill radio buttons
    var address1 = details.regadd.block + ' ' + details.regadd.street
    document.getElementById('entry_303748046').value = address1
    var address2 = '#' + details.regadd.floor + '-' + details.regadd.unit
    document.getElementById('entry_1490315281').value = address2
    var postal = details.regadd.postal
    document.getElementById('entry_1781395245').value = postal
    var income = details.assessableincome.value
    document.getElementById('entry_1306415138').value = income
    var cell = details.mobileno.nbr
    document.getElementById('entry_1768611784').value = cell
    var email = details.email.value
    document.getElementById('entry_1302158345').value = email
    var job = details.occupation.desc
    document.getElementById('entry_1860256791').value = job
  }
})
