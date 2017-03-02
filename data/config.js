// address the server is listening on
exports.host = "";
exports.port = 3000;

// valid basic auth credentials.
exports.auth = (username, password) => {
	return {
		"user": "pass",
		"foo": "bar",
	}[username] === password;
}