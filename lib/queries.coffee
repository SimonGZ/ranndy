knex = require("knex").knex
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
  validYears = _.range(1880, 2012)
  validYears.push(0)
  if validYears.indexOf(parseInt(req_year)) > -1
    context.where({year: parseInt(req_year)})
  else
    context.where({year: 0})

genderQuery = (context, req_gender) ->
  validGenders = ['male', 'female']
  if validGenders.indexOf(req_gender > -1
    gender = {'male': 'M', 'female': 'F'}
    context.where({gender: gender[req_gender]})
  else
    context.where({year: 0})

isUndefined = (element, index, array) ->
  return element is `undefined`

module.exports.isUndefined = isUndefined  
module.exports.limitQuery = limitQuery
module.exports.fast = fastSimpleQuery
module.exports.frequencyQuery = frequencyQuery
module.exports.raceQuery = raceQuery
module.exports.yearQuery = yearQuery
module.exports.genderQuery = genderQuery


isNumber = (n) ->
  return !isNaN(parseFloat(n)) && isFinite(n)