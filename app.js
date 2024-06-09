// Loading libraries
const async = require("async");
const _ = require("lodash");
const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});

// Loading Express
const express = require("express");
const app = express();

// Loading query functions
const queries = require("./lib/queries");

// Loading error handler
const errorHandler = require("./lib/errorHandler");

// Setting up public directory
app.use(express.static(__dirname + "/public"));

//Convenience Functions
const randomIntFromInterval = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min);

app.get("/api/surnames", (req, res) =>
  getSurnames(req, function (json, error) {
    if (error == null) {
      error = false;
    }
    if (error === true) {
      res.status(400).json(json);
    } else {
      res.json(json);
      errorHandler.clearErrors();
      errorHandler.clearWarnings();
    }
  }),
);

app.get("/api/firstnames", (req, res) =>
  getFirstnames(req, function (json, error) {
    if (error == null) {
      error = false;
    }
    if (error === true) {
      res.status(400).json(json);
    } else {
      res.json(json);
      errorHandler.clearErrors();
      errorHandler.clearWarnings();
    }
  }),
);

app.get("/api/names", (req, res) =>
  async.parallel(
    [
      (callback) => getFirstnames(req, (json) => callback(null, json)),
      (callback) => getSurnames(req, (json) => callback(null, json)),
    ],
    function (err, results) {
      let errors = [];

      _.each(results, function (result) {
        if (result.errors) {
          errors = result.errors;
        }
      });

      if (errors.length > 0) {
        res.status(400).json({ errors });
      } else {
        const cleanedResults = {};

        // Old method that cut down the array so that no entries were null
        // cleanedResults['names'] = _.filter(_.zip(results[0].firstnames, results[1].surnames), (nameArray) ->
        // return !_.some(nameArray, _.isUndefined)
        // )

        // Send a warning if the number of results is below the limit
        if (
          queries.limitQuery(req.query.limit) > results[0].firstnames.length ||
          queries.limitQuery(req.query.limit) > results[1].surnames.length
        ) {
          errorHandler.addWarning({
            message: "Limited Results",
            description:
              "The request returned fewer results than the limit. Consider loosening your query conditions.",
          });
        }

        if (errorHandler.warningsFound() > 0) {
          cleanedResults["warnings"] = errorHandler.listWarnings();
        }

        // If the first element of the array is null, replace it with the requested name
        if (_.isUndefined(results[0].firstnames[0])) {
          results[0].firstnames[0] = {
            name: queries.properCase(req.query.fstartswith.replace("^", "")),
          };
        }
        if (_.isUndefined(results[1].surnames[0])) {
          results[1].surnames[0] = {
            name: queries.properCase(req.query.sstartswith.replace("^", "")),
          };
        }

        // Note the length of the arrays for use in random generator
        const firstMax = results[0].firstnames.length - 1;
        const surMax = results[1].surnames.length - 1;

        // Create a "cleaned" array by zipping the two arrays into one and replacing null entries with a random earlier entry in the same array
        cleanedResults["names"] = _.filter(
          _.zip(results[0].firstnames, results[1].surnames),
          function (nameArray) {
            if (_.isUndefined(nameArray[0])) {
              nameArray[0] =
                results[0].firstnames[randomIntFromInterval(0, firstMax)];
            }
            if (_.isUndefined(nameArray[1])) {
              nameArray[1] =
                results[1].surnames[randomIntFromInterval(0, surMax)];
            }
            return nameArray;
          },
        );

        res.json(cleanedResults);
        errorHandler.clearErrors();
        errorHandler.clearWarnings();
      }
    },
  ),
);

var getSurnames = function (req, resultsCallback) {
  knex("surnames")
    .where(function () {
      if (
        [req.query.frequency, req.query.race, req.query.sstartswith].every(
          queries.isUndefined,
        )
      ) {
        return queries.fast(this, knex);
      } else {
        this.where(function () {
          queries.startsWithQuery(this, req.query.sstartswith, errorHandler);
        })
          .andWhere(function () {
            queries.frequencyQuery(this, req.query.frequency, errorHandler);
          })
          .andWhere(function () {
            queries.raceQuery(this, req.query.race, errorHandler);
          });
      }
    })
    .orderByRaw("RANDOM()")
    .limit(queries.limitQuery(req.query.limit, errorHandler))
    .then(function (query_results) {
      if (errorHandler.errorsFound() > 0) {
        throw new Error("Errors detected in errorHandler");
      } else {
        const results = { surnames: query_results };
        resultsCallback(results);
      }
    })
    .catch(function (e) {
      resultsCallback({ errors: errorHandler.listErrors() }, true);
      errorHandler.clearErrors();
      errorHandler.clearWarnings();
    });
};

var getFirstnames = (req, resultsCallback) =>
  async.series(
    [
      function (callback) {
        // Only run this code if both req.query.rank and req.query.gender exist
        if (req.query.rank !== undefined && req.query.gender !== undefined) {
          knex("firstnames")
            .max("rank")
            .where(function () {
              queries.yearQuery(this, req.query.year);
            })
            .andWhere(function () {
              queries.genderQuery(this, req.query.gender, errorHandler);
            })
            .then(
              (
                result, // Send the max(rank) to the callback function
              ) => callback(null, result[0].max),
            );
        } else {
          callback(null);
        }
      },
    ],
    (err, results) =>
      knex("firstnames")
        .where(function () {
          // Year query
          queries.yearQuery(this, req.query.year, errorHandler);
        })
        .andWhere(function () {
          queries.startsWithQuery(this, req.query.fstartswith, errorHandler);
        })
        .andWhere(function () {
          queries.genderQuery(this, req.query.gender, errorHandler);
        })
        .andWhere(function () {
          queries.rankQuery(this, req.query.rank, results[0], errorHandler);
        })
        .orderByRaw("RANDOM()")
        .limit(queries.limitQuery(req.query.limit, errorHandler))
        .then(function (query_results) {
          if (errorHandler.errorsFound() > 0) {
            throw new Error("Errors detected in errorHandler");
          } else {
            results = { firstnames: query_results };
            resultsCallback(results);
          }
        })
        .catch(function (e) {
          // NOTE: The following line can cause crashes from double resultsCallbacks when there's an unexpected error. Not sure how to fix.
          resultsCallback({ errors: errorHandler.listErrors() }, true);
          errorHandler.clearErrors();
          errorHandler.clearWarnings();
        }),
  );

var server = app.listen(process.env.port || 3000, () =>
  console.log("Listening on port %d", server.address().port),
);
