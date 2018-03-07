'use strict'

var fs = require('fs')
var request = require('request');
var express = require('express')
var http = require('http');
var https = require('https');
var fs = require('fs');
var app = express();
var httpsRedirect = require('express-https-redirect');
var sslOptions = {
	key: fs.readFileSync('./certs/key.pem'),
	cert: fs.readFileSync('./certs/cert.pem'),
	ca: fs.readFileSync('./certs/ca.pem'),
	ciphers: [
		"ECDHE-ECDSA-AES256-GCM-SHA384",
		"ECDHE-RSA-AES256-GCM-SHA384",
		"ECDHE-ECDSA-AES256-SHA384",
		"ECDHE-RSA-AES256-SHA384",
		"ECDHE-ECDSA-AES256-GCM-SHA256",
		"ECDHE-RSA-AES256-GCM-SHA256",
		"ECDHE-ECDSA-AES256-SHA256",
		"ECDHE-RSA-AES256-SHA256",
		"DHE-RSA-AES256-GCM-SHA384",
		"DHE-RSA-AES256-GCM-SHA256",
		"DHE-RSA-AES256-SHA256",
		"ECDHE-ECDSA-AES128-GCM-SHA256",
		"ECDHE-RSA-AES128-GCM-SHA256",
		"ECDHE-ECDSA-AES128-SHA256",
		"ECDHE-RSA-AES128-SHA256",
		"ECDHE-ECDSA-AES128-SHA",
		"ECDHE-RSA-AES128-SHA",
		"DHE-RSA-AES128-GCM-SHA256",
		"DHE-RSA-AES128-SHA256",
		"DHE-RSA-AES128-SHA",
		"AES256-GCM-SHA384",
		"AES256-SHA256",
		"AES128-GCM-SHA256",
		"AES128-SHA256",
		"AES128-SHA",
		"!aNULL",
		"!eNULL",
		"!EXPORT",
		"!DES",
		"!RC4",
		"!MD5",
		"!PSK",
		"!SRP",
		"!CAMELLIA"
	].join(':'),
	honorCipherOrder: true
};
var server = require('https').createServer(sslOptions, app)
app.use(function (req, res, next) {
	var nodeSSPI = require('node-sspi')
	var nodeSSPIObj = new nodeSSPI({
		retrieveGroups: true
	})
	nodeSSPIObj.authenticate(req, res, function(err){
		res.finished || next()
	})
});

app.use('/', httpsRedirect(true));

//UserName=ls12943&LocaleId=en_US&Relay=&Submit=Sign+In

app.use(function(req, res, next) {
	if(req.connection.user.indexOf('\\') >= 0) {
		var user = req.connection.user.split('\\')[1];
	} else {
		var user = req.connection.user;
	}
	request.post({
		followAllRedirects: false,
		url:'http://ochsaba1:8080/SabaTokenBasedSSO/TokenBasedSSOServlet',
		form: {
			UserName: user,
			LocaleId:'en_US',
			Relay:'',
			Submit:'Sign In'
			}
		}, function(err,httpResponse,body){
			if(err) {
				console.log(err);
			} else {
				console.log(user);
				console.log(httpResponse.headers.location);
				res.redirect(302, httpResponse.headers.location);
			}
	});
  /*var out =
    'Hello ' +
    req.connection.user +
    '! Your sid is ' +
    req.connection.userSid +
    ' and you belong to following groups:<br/><ul>'
  if (req.connection.userGroups) {
    for (var i in req.connection.userGroups) {
      out += '<li>' + req.connection.userGroups[i] + '</li><br/>\n'
    }
  }
  out += '</ul>'
  res.send(out)*/
  
})
// Start server
var port = process.env.PORT || 443
server.listen(port, function () {
	console.log('Express server listening on port %d in %s mode', port, app.get('env'))
})
