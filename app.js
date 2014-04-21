var express = require("express");
var app = express();
var Knex  = require('knex');
Knex.knex = Knex.initialize({
  client: 'pg',
  connection: {
    localhost: 'localhost',
    database: 'names'
  }
});

var knex = require('knex').knex;

app.use(express.static(__dirname + '/public'));

app.get('/api/surnames', function(req, res) {
	// Maybe build some sort of query handler function which returns an object with the
	// appropriate settings
	var query_limit = req.query.limit || 10;
	if ((query_limit > 100) || (query_limit < 1)){
		query_limit = 10;
	}
	knex('surnames').where(knex.raw('id in (select (random()*(select last_value from surnames_id_seq))::bigint from generate_series(1,120))')).limit(query_limit).then(function(query_results){
		results = {
			"surnames": query_results
		};
		res.json(results);
	});
});

var server = app.listen(process.env.port || 3000, function() {
    console.log('Listening on port %d', server.address().port);
});