var express = require('express');
var bodyParser = require('body-parser');
var jsonfile = require('jsonfile')
var proposals = require("./proposals.json");

var DATAFILE = "./data.json";

var data = jsonfile.readFileSync(DATAFILE);

var app = express();
app.use(express.static('static'));
app.use(bodyParser.json())

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

app.listen(3000, function () {
  console.log('App listening on port 3000!');
});