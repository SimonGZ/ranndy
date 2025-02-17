// Loading libraries
//
//
const async = require("async");
const _ = require("lodash");
const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3000, // Add port here
  },
});

const DEV_ENVIRONMENT = process.env.DEV;

// Loading Express
const express = require("express");
const app = express();

// Setting up Cors
const cors = require("cors");
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://ranndy.com",
  "https://beta.ranndy.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  }),
);

// Loading query functions
const queries = require("./lib/queries");

// Loading error handler
const errorHandler = require("./lib/errorHandler");

// Setting up public directory
app.use(express.static(__dirname + "/public"));

// Database connection test
knex
  .raw("SELECT 1") // A simple query that should always succeed
  .then(() => {
    if (DEV_ENVIRONMENT) console.log("Database connection successful!");
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1); // Exit the application if the connection fails
  });

//Convenience Functions
const randomIntFromInterval = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min);

app.get("/api/surnames", (req, res) =>
  getSurnames(req, function (json, error) {
    if (DEV_ENVIRONMENT) {
      console.log(req.query);
    }
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
    if (DEV_ENVIRONMENT) {
      console.log(req.query);
    }
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
        // But only if startswith actually exists
        if (
          _.isUndefined(results[0].firstnames[0]) &&
          !_.isUndefined(req.query.fstartswith)
        ) {
          results[0].firstnames[0] = {
            name: queries.properCase(req.query.fstartswith.replace("^", "")),
          };
        }
        if (
          _.isUndefined(results[1].surnames[0]) &&
          !_.isUndefined(req.query.sstartswith)
        ) {
          console.log(results);
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
        if (req.query.rank !== undefined) {
          knex("firstnames")
            .max("rank")
            .where(function () {
              queries.yearQuery(this, req.query.year);
            })
            .andWhere(function () {
              queries.genderQuery(this, req.query.gender, errorHandler);
            })
            .then((result) => callback(null, result[0].max))
            .catch((err) => callback(err)); // Add error handling here
        } else {
          callback(null);
        }
      },
    ],
    (err, results) => {
      // Handle error from async.series
      if (err) {
        resultsCallback({ errors: errorHandler.listErrors() }, true);
        errorHandler.clearErrors();
        errorHandler.clearWarnings();
        return; // Add return to prevent further execution
      }

      knex("firstnames")
        .where(function () {
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
            resultsCallback({ firstnames: query_results });
          }
        })
        .catch(function (e) {
          console.error(e);
          // Only call resultsCallback if it hasn't been called already
          resultsCallback({ errors: errorHandler.listErrors() }, true);
          errorHandler.clearErrors();
          errorHandler.clearWarnings();
        });
    },
  );

var server = app.listen(process.env.PORT || 3000, () =>
  console.log("Listening on port %d", server.address().port),
);
