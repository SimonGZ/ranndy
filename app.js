// Generated by CoffeeScript 1.7.1
var Knex, app, async, errorHandler, existy, express, isUndefined, knex, queries, server, _;

express = require("express");

app = express();

async = require("async");

_ = require("lodash");

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

GLOBAL.errors = [];

errorHandler = require("./lib/errorHandler");

app.get("/api/surnames", function(req, res) {
  return knex("surnames").where(function() {
    if ([req.query.frequency, req.query.race].every(queries.isUndefined)) {
      return queries.fast(this);
    } else {
      return this.where(function() {
        return queries.frequencyQuery(this, req.query.frequency, errorHandler);
      }).andWhere(function() {
        return queries.raceQuery(this, req.query.race, errorHandler);
      });
    }
  }).orderBy(knex.raw("RANDOM()")).limit(queries.limitQuery(req.query.limit, errorHandler)).then(function(query_results) {
    var results;
    if (errorHandler.errorsFound() > 0) {
      throw new Error("Errors detected in errorHandler");
    } else {

    }
    results = {
      surnames: query_results
    };
    return res.json(results);
  })["catch"](Error, function(e) {
    console.log(e);
    res.json(400, {
      errors: errorHandler.listErrors()
    });
    return errorHandler.clearErrors();
  });
});

app.get("/api/firstnames", function(req, res) {
  return async.series([
    function(callback) {
      if (!(req.query.rank === undefined || req.query.gender === undefined)) {
        return knex("firstnames_annual").select(knex.raw("max(rank)")).where(function() {
          return queries.yearQuery(this, req.query.year);
        }).andWhere(function() {
          return queries.genderQuery(this, req.query.gender);
        }).then(function(result) {
          return callback(null, result[0].max);
        });
      } else {
        return callback(null);
      }
    }
  ], function(err, results) {
    return knex("firstnames_annual").where(function() {
      return queries.yearQuery(this, req.query.year, errorHandler);
    }).andWhere(function() {
      return queries.genderQuery(this, req.query.gender, errorHandler);
    }).andWhere(function() {
      return queries.rankQuery(this, req.query.rank, results[0], errorHandler);
    }).orderBy(knex.raw("RANDOM()")).limit(queries.limitQuery(req.query.limit, errorHandler)).then(function(query_results) {
      if (errorHandler.errorsFound() > 0) {
        throw new Error("Errors detected in errorHandler");
      } else {
        results = {
          firstnames: query_results
        };
        return res.json(results);
      }
    })["catch"](Error, function(e) {
      console.log(e);
      res.json(400, {
        errors: errorHandler.listErrors()
      });
      return errorHandler.clearErrors();
    });
  });
});

server = app.listen(process.env.port || 3000, function() {
  return console.log("Listening on port %d", server.address().port);
});

existy = function(x) {
  return x !== null;
};

isUndefined = function(element, index, array) {
  return element === undefined;
};
