var express = require('express');
var app = express();

// Routes
app.get('/', function(req, res) {
	res.type('text/plain');
	res.send('i am a beautiful butterfly');
})

// Start the server
app.listen(process.env.PORT || 4730);