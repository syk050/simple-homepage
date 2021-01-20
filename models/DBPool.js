var mysql = require('mysql2/promise');

var pool = mysql.createPool({
    user: 'root',
    password: '1234',
    database: 'bulletin_board',
});


module.exports = pool;