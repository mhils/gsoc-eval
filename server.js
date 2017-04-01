var express = require("express");
var bodyParser = require("body-parser");
var jsonfile = require("jsonfile");
var parse_basic_auth = require("basic-auth");

var config = require("./data/config");

DATAFILE = "./data/data.json";
var proposals = jsonfile.readFileSync("./data/proposals.json");
var data = jsonfile.readFileSync(DATAFILE);

var app = express();
app.use(express.static("static"));
app.use(bodyParser.json());
app.use((req, res, next) => {
    let user = parse_basic_auth(req);
    if (!user || !config.auth(user.name, user.pass)) {
        res.set("WWW-Authenticate", "Basic realm=\"GSoC\"");
        return res.status(401).send();
    }
    req.user = user.name;
    return next();
});

app.get("/proposals.json", (req, res) => {
    res.send(proposals);
});
app.get("/data.json", (req, res) => {
    res.send(data);
});
app.get("/user.json", (req, res) => {
    /* a bit of a hack: reflect the basic auth username back */
    res.send({ user: req.user });
});

app.post("/data/:proposalId", function(req, res) {
    var proposalId = req.params.proposalId;
    var action = req.body;
    if (!proposalId || !action) {
        throw "invalid request";
    }
    action.timestamp = Date.now();
    action.user = req.user;

    console.log(
        req.connection.remoteAddress,
        `Update proposal ${proposalId}:`,
        action
    );

    data[proposalId] = data[proposalId] || [];
    data[proposalId].push(action);

    jsonfile.writeFile(DATAFILE, data, { spaces: 2 }, err => {
        if (err) {
            console.error(err);
        }
    });

    res.send(data);
});

app.listen(config.port, config.host, () => {
    console.log(`App listening on ${config.host || ""}:${config.port}!`);
});