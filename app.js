// Generated by CoffeeScript 1.7.1
var Knex, app, async, errorHandler, express, getFirstnames, getSurnames, knex, queries, server, _;

async = require("async");

_ = require("lodash");

Knex = require("knex");

Knex.knex = Knex.initialize({
  client: "pg",
  connection: {
    localhost: "localhost",
    user: "names",
    password: "***REMOVED***",
    database: "names"
  }
});

knex = require("knex").knex;

express = require("express");

app = express();

queries = require("./lib/queries");

errorHandler = require("./lib/errorHandler");

app.use(express["static"](__dirname + "/public"));

app.get("/api/surnames", function(req, res) {
  return getSurnames(req, function(json, error) {
    if (error == null) {
      error = false;
    }
    if (error === true) {
      return res.json(400, json);
    } else {
      return res.json(json);
    }
  });
});

app.get("/api/firstnames", function(req, res) {
  return getFirstnames(req, function(json, error) {
    if (error == null) {
      error = false;
    }
    if (error === true) {
      return res.json(400, json);
    } else {
      return res.json(json);
    }
  });
});

app.get("/api/names", function(req, res) {
  return async.parallel([
    function(callback) {
      return getFirstnames(req, function(json) {
        return callback(null, json);
      });
    }, function(callback) {
      return getSurnames(req, function(json) {
        return callback(null, json);
      });
    }
  ], function(err, results) {
    var cleanedResults, errors;
    errors = [];
    _.each(results, function(result) {
      if (result.errors) {
        return errors = result.errors;
      }
    });
    if (errors.length > 0) {
      return res.json(400, {
        errors: errors
      });
    } else {
      cleanedResults = {};
      cleanedResults['names'] = _.filter(_.zip(results[0].firstnames, results[1].surnames), function(nameArray) {
        return !_.some(nameArray, _.isUndefined);
      });
      if (queries.limitQuery(req.query.limit) > cleanedResults['names'].length) {
        errorHandler.addWarning({
          message: "Limited Results",
          description: "The request returned fewer results than the limit. Consider loosening your query conditions."
        });
      }
      if (errorHandler.warningsFound() > 0) {
        cleanedResults['warnings'] = errorHandler.listWarnings();
      }
      return res.json(cleanedResults);
    }
  });
});

getSurnames = function(req, resultsCallback) {
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
    return resultsCallback(results);
  })["catch"](Error, function(e) {
    resultsCallback({
      errors: errorHandler.listErrors()
    }, true);
    errorHandler.clearErrors();
    return errorHandler.clearWarnings();
  });
};

getFirstnames = function(req, resultsCallback) {
  return async.series([
    function(callback) {
      if (!(req.query.rank === undefined || req.query.gender === undefined)) {
        return knex("firstnames_annual").select(knex.raw("max(rank)")).where(function() {
          return queries.yearQuery(this, req.query.year);
        }).andWhere(function() {
          return queries.genderQuery(this, req.query.gender, errorHandler);
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
        return resultsCallback(results);
      }
    })["catch"](Error, function(e) {
      resultsCallback({
        errors: errorHandler.listErrors()
      }, true);
      errorHandler.clearErrors();
      return errorHandler.clearWarnings();
    });
  });
};

server = app.listen(process.env.port || 3000, function() {
  return console.log("Listening on port %d", server.address().port);
});
