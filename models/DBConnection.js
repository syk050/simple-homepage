var mysql = require('mysql2');

var client = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'bulletin_board',
});


module.exports = client;