knex = require("knex").knex

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

limitQuery = (limit) ->
  if (limit <= 100) and (limit >= 1)
    return limit
  else 
    return 10

isUndefined = (element, index, array) ->
  return element is `undefined`

module.exports.isUndefined = isUndefined  
module.exports.limitQuery = limitQuery
module.exports.fast = fastSimpleQuery
module.exports.frequencyQuery = frequencyQuery
