const async = require("async");
const _ = require("lodash");
const errorHandler = require("../lib/errorHandler");

const fastSimpleQuery = (context, knex) =>
  context.where(
    knex.raw(
      "id in (select (random()*(select last_value from surnames_id_seq))::bigint from generate_series(1,120))",
    ),
  );

const frequencyColumnName = "prop100k";

const frequencyQuery = function (context, freq, errorHandler) {
  if (freq === "low") {
    context.where(frequencyColumnName, "<", 0.06);
  } else if (freq === "medium") {
    context
      .where(frequencyColumnName, ">=", 0.06)
      .andWhere(frequencyColumnName, "<", 1);
  } else if (freq === "high") {
    context.where(frequencyColumnName, ">=", 1);
  } else if (freq === "any") {
    anyFrequency(context);
  } else {
    if (!_.isUndefined(freq)) {
      errorHandler.addError(errorHandler.errorCodes["invalid_frequency"]);
    }
    anyFrequency(context);
  }
};

var anyFrequency = (context) => context.where(frequencyColumnName, ">", -1);

const raceQuery = function (context, raceArray, errorHandler) {
  if (!_.isUndefined(raceArray)) {
    if (_.isString(raceArray[0]) && _.parseInt(raceArray[1])) {
      if (
        _.includes(
          [
            "pctwhite",
            "pctasian",
            "pctnative",
            "pctblack",
            "pcthispanic",
            "any",
          ],
          raceArray[0],
        )
      ) {
        if (raceArray[1] > 99 || raceArray[1] < 1) {
          errorHandler.addError(errorHandler.errorCodes["invalid_race_pct"]);
        } else if (raceArray[0] === "any") {
          anyRace(context);
        } else {
          context.where(raceArray[0], ">", Math.abs(_.parseInt(raceArray[1])));
        }
      } else {
        errorHandler.addError(errorHandler.errorCodes["invalid_race"]);
        anyRace(context);
      }
    } else {
      errorHandler.addError(errorHandler.errorCodes["invalid_race_pct"]);
      anyRace(context);
    }
  } else {
    anyRace(context);
  }
};

var anyRace = (context) => context.where("pctwhite", ">", -1);

const limitQuery = function (limit, errorHandler) {
  if (limit <= 100 && limit >= 1) {
    return limit;
  } else {
    if (!_.isUndefined(limit)) {
      errorHandler.addError(errorHandler.errorCodes["invalid_limit"]);
    }
    return 10;
  }
};

const yearQuery = function (context, req_year, errorHandler) {
  const year = sanitizeYear(req_year, errorHandler);
  context.where({ year });
};

var sanitizeYear = function (rawYear, errorHandler) {
  const validYears = _.range(1880, 2025); // so stopping in 2024
  validYears.push(0);
  if (validYears.indexOf(parseInt(rawYear)) > -1) {
    return parseInt(rawYear);
  } else if (_.isUndefined(rawYear)) {
    return 0;
  } else {
    errorHandler.addError(errorHandler.errorCodes["invalid_year"]);
    return 0;
  }
};

const genderQuery = function (context, req_gender, errorHandler) {
  const gender = sanitizeGender(req_gender);
  if (gender) {
    context.where({ gender });
  } else {
    if (!_.isUndefined(req_gender) && req_gender !== "any") {
      errorHandler.addError(errorHandler.errorCodes["invalid_gender"]);
    }
    context.where("gender", "LIKE", "%");
  }
};

var sanitizeGender = function (rawGender) {
  const validGenders = ["male", "female"];
  if (validGenders.indexOf(rawGender > -1)) {
    const gender = { male: "M", female: "F" };
    return gender[rawGender];
  } else {
    return false;
  }
};

const rankQuery = function (context, req_rank, maxRank, errorHandler) {
  if (_.isString(req_rank) && !_.isUndefined(maxRank)) {
    if (maxRank > 5000) {
      if (req_rank === "low") {
        context.where("rank", ">", 800);
      } else if (req_rank === "high") {
        context.where("rank", "<=", 800);
      } else if (req_rank === "any") {
        anyRank(context);
      } else {
        errorHandler.addError(errorHandler.errorCodes["invalid_rank"]);
        anyRank(context);
      }
    } else if (maxRank > 500) {
      if (req_rank === "low") {
        context.where("rank", ">", 300);
      } else if (req_rank === "high") {
        context.where("rank", "<=", 300);
      } else if (req_rank === "any") {
        anyRank(context);
      } else {
        errorHandler.addError(errorHandler.errorCodes["invalid_rank"]);
        anyRank(context);
      }
    } else if (maxRank < 500) {
      if (req_rank === "low") {
        context.where("rank", ">", 125);
      } else if (req_rank === "high") {
        context.where("rank", "<=", 125);
      } else if (req_rank === "any") {
        anyRank(context);
      } else {
        errorHandler.addError(errorHandler.errorCodes["invalid_rank"]);
        anyRank(context);
      }
    }
  } else {
    anyRank(context);
  }
};

const startsWithQuery = function (context, req_letter, errorHandler) {
  if (req_letter) {
    if (!req_letter.match(/[^a-zA-Z\-]/)) {
      context.where("name", "LIKE", properCase(req_letter) + "%");
      // console.log "postProper: " + properCase(req_letter)

      // Look for * characters
    } else if (req_letter.match(/,*([a-zA-Z]+)\*/g)) {
      const matches = req_letter.match(/,*([a-zA-Z]+)\*/g);
      let pass = context;

      // Cycle through the matches adding NOT LIKE where statements
      _.each(
        matches,
        (match) =>
          (pass = context.where(
            "name",
            "NOT LIKE",
            properCase(match.replace(",", "").replace("*", "")) + "%",
          )),
      );

      // Need to figure out how to do multiple where statements based on number of matches
      // Maybe limit it to three exclusions and change NOT LIKE to LIKE and leave "%" by itself
      // Or maybe this is a job for some sort of pass variable that holds the context and then adds more through while
      return pass;
    } else if (req_letter.match(/([a-zA-Z]+)\^/)) {
      const match = properCase(req_letter.match(/([a-zA-Z]+)\^/)[0]).replace(
        "^",
        "",
      );
      context.where("name", match);
    } else {
      errorHandler.addError(errorHandler.errorCodes["invalid_startswith"]);
      context.where("name", "LIKE", "%");
    }
  } else {
    context.where("name", "LIKE", "%");
  }
};

var anyRank = (context) => context.where("rank", ">=", 0);

var properCase = (string) =>
  (string = string.replace(/\w\S*/g, function (txt) {
    let proper = txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    // console.log "insideProper: " + proper

    if (proper.match(/-([a-z])/) !== null) {
      const match = proper.match(/-([a-z])/);
      proper =
        proper.substring(0, match.index + 1) +
        proper.charAt(match.index + 1).toUpperCase() +
        proper.substring(match.index + 2);
    }
    // console.log "MatchLoop: " + proper

    return proper;
  }));

const isUndefined = (element, index, array) => element === undefined;

module.exports.isUndefined = isUndefined;
module.exports.limitQuery = limitQuery;
module.exports.fast = fastSimpleQuery;
module.exports.frequencyQuery = frequencyQuery;
module.exports.raceQuery = raceQuery;
module.exports.yearQuery = yearQuery;
module.exports.genderQuery = genderQuery;
module.exports.rankQuery = rankQuery;
module.exports.startsWithQuery = startsWithQuery;
module.exports.sanitizeGender = sanitizeGender;
module.exports.sanitizeYear = sanitizeYear;
module.exports.properCase = properCase;
