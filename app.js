var express = require('express');
var app = express();


// Sample Data
var quotes = [
  { author : 'Audrey Hepburn', text : "Nothing is impossible, the word itself says 'I'm possible'!"},
  { author : 'Walt Disney', text : "You may not realize it when it happens, but a kick in the teeth may be the best thing in the world for you"},
  { author : 'Unknown', text : "Even the greatest was once a beginner. Don't be afraid to take that first step."},
  { author : 'Neale Donald Walsch', text : "You are afraid to die, and you're afraid to live. What a way to exist."}
];

// Database Connection
var pg = require('pg');
var conString = "postgres://localhost/names";


// Routes
app.get('/', function(req, res) {
	res.json(quotes);
});

app.get('/quote/random', function(req, res) {
	var id = Math.floor(Math.random() * quotes.length);
	var q = quotes[id];
	res.json(q);
});

app.get('/quote/:id', function(req, res) {
	if(quotes.length <= req.params.id || req.params.id < 0) {
		res.statusCode = 404;
		return res.send('Error 404: No quote found');
	}

	var q = quotes[req.params.id];
	res.json(q);
});

app.get('/surnames', function(req, res) {
	pg.connect(conString, function(err, client, done) {
		if (err) {
			return console.error('Error fetching client from pool', err);
		}

		getSurnames(client, res);
		done();
	});
});

app.get('/firstnames', function(req, res) {
	pg.connect(conString, function(err, client, done) {
		if (err) {
			return console.error('Error fetching client from pool', err);
		}

		getFirstNames(client, function(results) { res.json(results) });

		done();
	});
});

app.get('/names', function(req, res) {
	pg.connect(conString, function(err, client, done) {
		if (err) {
			return console.error('Error fetching client from pool', err);
		}

		getFirstNames(client, function(x) { res.json(results) });

		done();
	});
});

function getFirstNames(client, fn) {
	var querystring = 'SELECT * from firstnames ORDER BY random() LIMIT 10'
	client.query(querystring, function(err, result) {

		if (err) {
			return console.error('Error running query', err);
		}
		fn(result.rows);
	});
};

var getSurnames = function(client, res) {
	var querystring = 'SELECT * from surnames ORDER BY random() LIMIT 10'
	client.query(querystring, function(err, result) {

		if (err) {
			return console.error('Error running query', err);
		}
		res.json(result.rows);
	});
};

// Start the server
app.listen(process.env.PORT || 4730);