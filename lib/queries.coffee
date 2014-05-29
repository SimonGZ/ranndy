knex = require("knex").knex
async = require("async")
_ = require('lodash')
errorHandler = require('../lib/errorHandler')

fastSimpleQuery = (context) ->
  context.where( knex.raw("id in (select (random()*(select last_value from surnames_id_seq))::bigint from generate_series(1,120))"))

frequencyQuery = (context, freq, errorHandler) ->
  if freq is "low"
    context.where("frequency", "<", 0.06)
  else if freq is "medium"
    context.where("frequency", ">=", 0.06).andWhere("frequency", "<", 1)
  else if freq is "high"
    context.where("frequency", ">=", 1)
  else if freq is "any"
    anyFrequency(context)
  else
    if !_.isUndefined(freq) then errorHandler.addError(errorHandler.errorCodes['invalid_frequency'])
    anyFrequency(context)

anyFrequency = (context) ->
  context.where("frequency", ">", -1)

raceQuery = (context, raceArray, errorHandler) ->
  if !_.isUndefined(raceArray) 
    if _.isString(raceArray[0]) and _.parseInt(raceArray[1])
      if _.contains(["pctwhite","pctasian","pctnative","pctblack","pcthispanic", "any"], raceArray[0])
        if raceArray[1] > 99 or raceArray[1] < 1
          errorHandler.addError(errorHandler.errorCodes['invalid_race_pct'])
        else if raceArray[0] is "any"
          anyRace(context)
        else
          context.where(raceArray[0], ">", Math.abs(raceArray[1]))
      else
        errorHandler.addError(errorHandler.errorCodes['invalid_race'])
        anyRace(context)
    else
      errorHandler.addError(errorHandler.errorCodes['invalid_race_pct'])
      anyRace(context)
  else
    anyRace(context)

anyRace = (context) ->
  context.where("pctwhite", ">", -1)  

limitQuery = (limit, errorHandler) ->
  if (limit <= 100) and (limit >= 1)
    return limit
  else
    if !_.isUndefined(limit) then errorHandler.addError(errorHandler.errorCodes['invalid_limit'])
    return 10

yearQuery = (context, req_year, errorHandler) ->
  year = sanitizeYear(req_year, errorHandler)
  context.where({year: year})

sanitizeYear = (rawYear, errorHandler) ->
  validYears = _.range(1880, 2012)
  validYears.push(0)
  if validYears.indexOf(parseInt(rawYear)) > -1
    return parseInt(rawYear)
  else if _.isUndefined(rawYear)
    return 0
  else
    errorHandler.addError(errorHandler.errorCodes['invalid_year'])
    return 0

genderQuery = (context, req_gender, errorHandler) ->  
  gender = sanitizeGender(req_gender)
  if gender
    context.where({gender: gender})
  else
    if !_.isUndefined(req_gender) and req_gender != "any"
      errorHandler.addError(errorHandler.errorCodes['invalid_gender'])
    context.where('gender', 'LIKE', '%')

sanitizeGender = (rawGender) ->
  validGenders = ['male', 'female']
  if validGenders.indexOf rawGender > -1
    gender = {'male': 'M', 'female': 'F'}
    return gender[rawGender]
  else
    return false

rankQuery = (context, req_rank, maxRank, errorHandler) ->
  if _.isString(req_rank) and !_.isUndefined(maxRank)
    if maxRank > 500
      if req_rank is "low"
        context.where("rank", ">", 300)
      else if req_rank is "medium"
        context.where("rank", ">", 150).andWhere("rank", "<=", 300)
      else if req_rank is "high"
        context.where("rank", "<=", 150)
      else if req_rank is "any"
        anyRank(context)
      else
        errorHandler.addError(errorHandler.errorCodes['invalid_rank'])
        anyRank(context)
    else if maxRank < 500
      if req_rank is "low"
        context.where("rank", ">", 100)
      else if req_rank is "medium"
        context.where("rank", ">", 50).andWhere("rank", "<=", 100)
      else if req_rank is 'high'
        context.where("rank", "<=", 50)
      else if req_rank is "any"
        anyRank(context)
      else
        errorHandler.addError(errorHandler.errorCodes['invalid_rank'])
        anyRank(context)
  else
    anyRank(context)

anyRank = (context) ->
  context.where("rank", ">=", 0)
    

    
isUndefined = (element, index, array) ->
  return element is `undefined`

module.exports.isUndefined = isUndefined  
module.exports.limitQuery = limitQuery
module.exports.fast = fastSimpleQuery
module.exports.frequencyQuery = frequencyQuery
module.exports.raceQuery = raceQuery
module.exports.yearQuery = yearQuery
module.exports.genderQuery = genderQuery
module.exports.rankQuery = rankQuery
module.exports.sanitizeGender = sanitizeGender
module.exports.sanitizeYear = sanitizeYear


isNumber = (n) ->
  return !isNaN(parseFloat(n)) && isFinite(n)
