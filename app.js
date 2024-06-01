// Generated by CoffeeScript 2.7.0
(function() {
  // Loading libraries
  var _, app, async, errorHandler, express, getFirstnames, getSurnames, knex, queries, randomIntFromInterval, server;

  async = require("async");

  _ = require("lodash");

  knex = require("knex")({
    client: "pg",
    connection: {
      localhost: "localhost",
      user: "names",
      password: "***REMOVED***",
      database: "names"
    }
  });

  // Loading Express
  express = require("express");

  app = express();

  // Loading query functions
  queries = require("./lib/queries");

  // Loading error handler
  errorHandler = require("./lib/errorHandler");

  // Setting up public directory
  app.use(express.static(__dirname + "/public"));

  //Convenience Functions
  randomIntFromInterval = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  app.get("/api/surnames", function(req, res) {
    return getSurnames(req, function(json, error = false) {
      if (error === true) {
        console.log('error happening');
        return res.status(400).json(json);
      } else {
        console.log('error not happening');
        res.json(json);
        errorHandler.clearErrors();
        return errorHandler.clearWarnings();
      }
    });
  });

  app.get("/api/firstnames", function(req, res) {
    return getFirstnames(req, function(json, error = false) {
      if (error === true) {
        return res.status(400).json(json);
      } else {
        res.json(json);
        errorHandler.clearErrors();
        return errorHandler.clearWarnings();
      }
    });
  });

  app.get("/api/names", function(req, res) {
    return async.parallel([
      function(callback) {
        return getFirstnames(req,
      function(json) {
          return callback(null,
      json);
        });
      },
      function(callback) {
        return getSurnames(req,
      function(json) {
          return callback(null,
      json);
        });
      }
    ], function(err, results) {
      var cleanedResults, errors, firstMax, surMax;
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
        
        // Old method that cut down the array so that no entries were null
        // cleanedResults['names'] = _.filter(_.zip(results[0].firstnames, results[1].surnames), (nameArray) ->
        // return !_.some(nameArray, _.isUndefined)
        // )

        // Send a warning if the number of results is below the limit
        if (queries.limitQuery(req.query.limit) > results[0].firstnames.length || queries.limitQuery(req.query.limit) > results[1].surnames.length) {
          errorHandler.addWarning({
            message: "Limited Results",
            description: "The request returned fewer results than the limit. Consider loosening your query conditions."
          });
        }
        if (errorHandler.warningsFound() > 0) {
          cleanedResults['warnings'] = errorHandler.listWarnings();
        }
        // If the first element of the array is null, replace it with the requested name
        if (_.isUndefined(results[0].firstnames[0])) {
          results[0].firstnames[0] = {
            'name': queries.properCase(req.query.fstartswith.replace('^', ''))
          };
        }
        if (_.isUndefined(results[1].surnames[0])) {
          results[1].surnames[0] = {
            'name': queries.properCase(req.query.sstartswith.replace('^', ''))
          };
        }
        // Note the length of the arrays for use in random generator
        firstMax = results[0].firstnames.length - 1;
        surMax = results[1].surnames.length - 1;
        // Create a "cleaned" array by zipping the two arrays into one and replacing null entries with a random earlier entry in the same array
        cleanedResults['names'] = _.filter(_.zip(results[0].firstnames, results[1].surnames), function(nameArray) {
          if (_.isUndefined(nameArray[0])) {
            nameArray[0] = results[0].firstnames[randomIntFromInterval(0, firstMax)];
          }
          if (_.isUndefined(nameArray[1])) {
            nameArray[1] = results[1].surnames[randomIntFromInterval(0, surMax)];
          }
          return nameArray;
        });
        res.json(cleanedResults);
        errorHandler.clearErrors();
        return errorHandler.clearWarnings();
      }
    });
  });

  getSurnames = function(req, resultsCallback) {
    console.log("running getSurnames");
    return knex("surnames").where(function() {
      if ([req.query.frequency, req.query.race, req.query.sstartswith].every(queries.isUndefined)) {
        return queries.fast(this, knex);
      } else {
        return this.where(function() {
          return queries.startsWithQuery(this, req.query.sstartswith, errorHandler);
        }).andWhere(function() {
          return queries.frequencyQuery(this, req.query.frequency, errorHandler);
        }).andWhere(function() {
          return queries.raceQuery(this, req.query.race, errorHandler);
        });
      }
    }).orderByRaw("RANDOM()").limit(queries.limitQuery(req.query.limit, errorHandler)).then(function(query_results) {
      var results;
      console.log("now in then function");
      if (errorHandler.errorsFound() > 0) {
        console.log("errors found in error handler");
        throw new Error("Errors detected in errorHandler");
      } else {
        results = {
          surnames: query_results
        };
        return resultsCallback(results);
      }
    }).catch(function(e) {
      // console.log "Caught Surnames Error: #{e}"
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
        // Only run this code if both req.query.rank and req.query.gender exist
        if (!(req.query.rank === undefined || req.query.gender === undefined)) {
          return knex("firstnames_annual").max("rank").where(function() {
            return queries.yearQuery(this,
      req.query.year);
          }).andWhere(function() {
            return queries.genderQuery(this,
      req.query.gender,
      errorHandler);
          }).then(function(result) {
            // Send the max(rank) to the callback function
            return callback(null,
      result[0].max);
          });
        } else {
          return callback(null);
        }
      }
    ], function(err, results) {
      return knex("firstnames_annual").where(function() {
        // Year query
        return queries.yearQuery(this, req.query.year, errorHandler);
      }).andWhere(function() {
        return queries.startsWithQuery(this, req.query.fstartswith, errorHandler);
      }).andWhere(function() {
        return queries.genderQuery(this, req.query.gender, errorHandler);
      }).andWhere(function() {
        return queries.rankQuery(this, req.query.rank, results[0], errorHandler);
      }).orderByRaw("RANDOM()").limit(queries.limitQuery(req.query.limit, errorHandler)).then(function(query_results) {
        if (errorHandler.errorsFound() > 0) {
          throw new Error("Errors detected in errorHandler");
        } else {
          results = {
            firstnames: query_results
          };
          return resultsCallback(results);
        }
      }).catch(function(e) {
        // console.log "Caught Firstnames Error: #{e}"
        // NOTE: The following line can cause crashes from double resultsCallbacks when there's an unexpected error. Not sure how to fix.
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

}).call(this);
