var express = require('express');
var app = express();
var async = require('async');

// Database Connection
var pg = require('pg');
var conString = "postgres://localhost/names";


// Routes
app.use(express.static(process.cwd() + '/public'));

app.get('/api/surnames', function(req, res) {
	pg.connect(conString, function(err, client, done) {
		if (err) {
			return console.error('Error fetching client from pool', err);
		}

		getSurnames(client, req.query, function(results) { return res.json(results) });

		done();
	});
});

app.get('/api/firstnames', function(req, res) {
	pg.connect(conString, function(err, client, done) {
		if (err) {
			return console.error('Error fetching client from pool', err);
		}

		getFirstNames(client, req.query, function(results) { return res.json(results) });

		done();
	});
});

app.get('/api/names', function(req, res) {
	pg.connect(conString, function(err, client, done) {
		if (err) {
			return console.error('Error fetching client from pool', err);
		}

		async.parallel(
		{
			firstnames: function(callback) {
				getFirstNames(client, req.query, function(results) { callback(null, results) });
			},
			surnames: function(callback) {
				getSurnames(client, req.query, function(results) { callback(null, results) });
			}
		},
		function(err, results) {
			done();
			res.json(results);
		}
		);
	});
});

function capitalizeFirstLetter(string)
{
	string = string.toLowerCase();
    return string.charAt(0).toUpperCase() + string.slice(1);
}

String.prototype.splice = function( idx, rem, s ) {
    return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
};

function andOrWhere(querystring) {
	if (querystring.indexOf("WHERE") === -1 ) {
		return " WHERE ";
	}
	else {
		return " AND ";
	}
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function containsRace(string) {
	if (string.indexOf("pctwhite") > -1 || string.indexOf("pctblack") > -1 || string.indexOf("pctasian") > -1 || string.indexOf("pctnative") > -1 || string.indexOf("pcthispanic") > -1)  {
		return true;
	}
	else {
		return false;
	}
}

function updateQueryWithLimit(string, limit) {
	if (isNumber(limit)) {
		if (limit <= 100) {
			return string.replace("LIMIT 10", "LIMIT " + limit);
		}
		else {
			return string;
		}
	}
}

function getFirstNames(client, params, callback) {
	
	var querystring = "SELECT name, gender, rank, frequency from firstnames ORDER BY random() LIMIT 10";

	if (params['gender']) {
		if (params['gender'].toLowerCase() == 'female' || params['gender'].toLowerCase() == 'male') {
			position = querystring.indexOf("ORDER BY");
			querystring = querystring.splice(position, 0, andOrWhere(querystring) + "gender = '" + capitalizeFirstLetter(params['gender']) +"'");
		}
	}

	if (params['fRank']) {
		if (isNumber(params['fRank'])) {
			position = querystring.indexOf("ORDER BY");
			querystring = querystring.splice(position, 0, andOrWhere(querystring) + "rank < '" + params['fRank'] +"'");	
		}
	}

	if (params['limit']) {
		querystring = updateQueryWithLimit(querystring, params['limit']);		
	}

	client.query(querystring, function(err, result) {

		if (err) {
			callback(err);
			return console.error('Error running query', err);
		}
		callback(result.rows);
	});
};

var getSurnames = function(client, params, callback) {
	var querystring = 'SELECT name, rank, frequency, pctwhite, pctblack, pctasian, pctnative, pcthispanic from surnames ORDER BY random() LIMIT 10'

	if (params['sRank']) {
		if (isNumber(params['sRank'])) {
			position = querystring.indexOf("ORDER BY");
			querystring = querystring.splice(position, 0, andOrWhere(querystring) + "rank < '" + params['sRank'] +"'");	
		}
	}

	if (params['race']) {
		var percent, race;
		if (containsRace(params['race']) && params['race'].indexOf(",") > -1) {
			race = params['race'].split(",")[0];
			percent = params['race'].split(",")[1];
			if (isNumber(percent)) {
				if (percent > 100 || percent < 0) {
					percent = 0;
				}
			}
			else {
				percent = 0;
			}
			position = querystring.indexOf("ORDER BY");
			querystring = querystring.splice(position, 0, andOrWhere(querystring) + race + " > " + percent);			
		}		
	}

	if (params['limit']) {
		querystring = updateQueryWithLimit(querystring, params['limit']);		
	}

	client.query(querystring, function(err, result) {

		if (err) {
			callback(err);
			return console.error('Error running query', err);
		}
		callback(result.rows);
	});
};

// Start the server
app.listen(process.env.PORT || 4730);