'use strict'

var fs = require('fs')
var request = require('request');
var express = require('express')
var http = require('http');
var https = require('https');
var fs = require('fs');
var app = express();
//var httpsRedirect = require('express-https-redirect');
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
		retrieveGroups: false
	})
	nodeSSPIObj.authenticate(req, res, function(err){
		res.finished || next()
	})
});

//app.use('/', httpsRedirect(true));

app.use(function(req, res, next) {
	var redirect = '';
	if(req.connection.user.indexOf('\\') >= 0) {
		var user = req.connection.user.split('\\')[1];
	} else {
		var user = req.connection.user;
	}
	request.post({
		followRedirect: false,
		url:'http://localhost:8080/SabaTokenBasedSSO/TokenBasedSSOServlet',
		form: {
			UserName: user,
			LocaleId:'en_US',
			Relay:'',
			Submit:'Sign In'
			}
		}, function(err,httpResponse,body){
			if(err) {
				console.log(err);
				res.send('error');
			} else {
				console.log(user);
				//console.log(httpResponse.headers.location);
				//res.redirect(302, httpResponse.headers.location);
				//res.send(httpResponse);
				redirect = httpResponse.headers.location;
				request({
					followRedirect: false,
					url: httpResponse.headers.location
				}, function(err,httpResponse,body) {
					if(err) {
						console.log(err);
						res.send('error');
					} else {
						if(httpResponse.statusCode==302) {
							res.redirect(302, redirect);
						} else {
							//console.log(httpResponse);
							//res.send(httpResponse);
							console.log('Saba rejected user, prompting for credentials');
							res.status(401);
							res.set('WWW-Authenticate', 'Basic realm="Enter Domain Credentials"');
							res.send(user + ' authenticated, but denied by saba')
						}
					}
				});
			}
	});
	/*console.log(user);
	res.status(401);
	res.set('WWW-Authenticate', 'Basic realm="User Visible Realm"');
	res.send(user)*/
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
var httpsport = process.env.PORT || 443
server.listen(httpsport, function () {
	console.log('Express server listening on port %d in %s mode', httpsport, app.get('env'))
})
