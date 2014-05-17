// Generated by CoffeeScript 1.7.1
var Knex, app, express, knex, queries, server;

express = require("express");

app = express();

Knex = require("knex");

Knex.knex = Knex.initialize({
  client: "pg",
  connection: {
    localhost: "localhost",
    database: "names"
  }
});

knex = require("knex").knex;

queries = require("./lib/queries");

app.use(express["static"](__dirname + "/public"));

app.get("/api/surnames", function(req, res) {
  console.log("Request is " + req.query.limit);
  console.log("Function returns " + (queries.limit_query(req.query.limit)));
  return knex("surnames").where(function() {
    if (req.query.frequency === undefined) {
      return queries.fast(this);
    } else if (req.query.frequency) {
      return queries.frequency_query(this, req.query.frequency);
    }
  }).limit(queries.limit_query(req.query.limit)).then(function(query_results) {
    var results;
    results = {
      surnames: query_results
    };
    return res.json(results);
  });
});

server = app.listen(process.env.port || 3000, function() {
  return console.log("Listening on port %d", server.address().port);
});
