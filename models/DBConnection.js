var mysql = require('mysql');

var client = mysql.createConnection({
    user: 'root',   password: '1234',  database: 'bulletin_board'
});


module.exports = client;