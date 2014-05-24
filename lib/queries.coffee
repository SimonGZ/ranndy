knex = require("knex").knex
async = require("async")
_ = require('lodash')

fastSimpleQuery = (context) ->
  context.where( knex.raw("id in (select (random()*(select last_value from surnames_id_seq))::bigint from generate_series(1,120))"))

frequencyQuery = (context, freq) ->
  if freq is "low"
    context.where("frequency", "<", 0.06)
  else if freq is "medium"
    context.where("frequency", ">=", 0.06).andWhere("frequency", "<", 1)
  else if freq is "high"
    context.where("frequency", ">=", 1)
  else
    fastSimpleQuery(context)

raceQuery = (context, raceArray) ->
  if (["pctwhite","pctasian","pctnative","pctblack","pcthispanic"].indexOf(raceArray[0]) > -1) and isNumber(raceArray[1])
    context.where(raceArray[0], ">", Math.abs(raceArray[1]))
  else
    fastSimpleQuery(context)

limitQuery = (limit) ->
  if (limit <= 100) and (limit >= 1)
    return limit
  else 
    return 10

yearQuery = (context, req_year) ->
  year = sanitizeYear(req_year)
  context.where({year: year})

sanitizeYear = (rawYear) ->
  validYears = _.range(1880, 2012)
  validYears.push(0)
  if validYears.indexOf(parseInt(rawYear)) > -1
    return parseInt(rawYear)
  else
    return 0

genderQuery = (context, req_gender) ->  
  gender = sanitizeGender(req_gender)
  if gender
    context.where({gender: gender})
  else
    context.where('gender', 'LIKE', '%')

sanitizeGender = (rawGender) ->
  validGenders = ['male', 'female']
  if validGenders.indexOf rawGender > -1
    gender = {'male': 'M', 'female': 'F'}
    return gender[rawGender]
  else
    return false

rankQuery = (context, req_rank, maxRank) ->
  if _.isString(req_rank) and !_.isUndefined(maxRank)
    if maxRank > 500
      if req_rank is "low"
        context.where("rank", ">", 300)
      else if req_rank is "medium"
        context.where("rank", ">", 150).andWhere("rank", "<=", 300)
      else if req_rank is "high"
        context.where("rank", "<=", 150)
      else
        anyRank(context)
    else if maxRank < 500
      if req_rank is "low"
        context.where("rank", ">", 100)
      else if req_rank is "medium"
        context.where("rank", ">", 50).andWhere("rank", "<=", 100)
      else if req_rank is 'high'
        context.where("rank", "<=", 50)
      else
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
