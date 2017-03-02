
exports.host = "";
exports.port = 3000;

exports.auth = (username, password) => {
	return {
		"user": "pass",
		"foo": "bar",
	}[username] === password;
}