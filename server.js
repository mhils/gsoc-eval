var express = require('express');
var bodyParser = require('body-parser');
var jsonfile = require('jsonfile')
var program = require('commander');
var auth = require('basic-auth');

program
	.option("--user [user]", "Basic Auth Username")
	.option("--pass [pass]", "Basic Auth Password")
	.option("--port [p]", "Port", function(x){return parseInt(x)}, 3000)
	.option("--host [a]", "Host")
	.parse(process.argv);

var proposals = require("./proposals.json");

var DATAFILE = "./data.json";

var data = jsonfile.readFileSync(DATAFILE);

var app = express();
app.use(express.static('static'));
app.use(bodyParser.json())
app.use(function(req, res, next) {
  var user = auth(req);
  if (!user || user.name !== program.user || user.pass !== program.pass) {
    res.set('WWW-Authenticate', 'Basic realm="GSoC"');
    return res.status(401).send();
  }
  return next();
});


app.get('/proposals.json', function (req, res) {
  res.send(proposals);
});

app.get('/data', function (req, res) {
  res.send(data);
});

app.post('/data/:proposalId', function(req, res) {
  var proposalId = req.params.proposalId;
  var newData = req.body;
  if(!proposalId || !newData){
  	throw "invalid request";
  }
  newData.timestamp = Date.now();
  data[proposalId] = data[proposalId] || [];
  data[proposalId].push(newData);

  jsonfile.writeFile(DATAFILE, data, {spaces: 2}, function (err) {
  	if(err) {
  		console.error(err)
  	}
  });

  res.send(data);
});

app.listen(program.port, program.host, function () {
  console.log('App listening on ' + 
  	(program.host || '') + ':' + program.port + '!'
  );
});