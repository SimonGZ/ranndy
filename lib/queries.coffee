knex = require("knex").knex

fast_simple_query = (context) ->
  context.where knex.raw("id in (select (random()*(select last_value from surnames_id_seq))::bigint from generate_series(1,120))")

frequency_query = (context, freq) ->
  if freq is "low"
        context.where "frequency", "<", 0.06
      else if freq is "medium"
        context.where("frequency", ">=", 0.06).andWhere "frequency", "<", 1
      else if freq is "high"
        context.where "frequency", ">=", 1
      else
        fast_simple_query context

limit_query = (limit) ->
  if (limit <= 100) and (limit >= 1)
    return limit
  else 
    return 10
  
module.exports.limit_query = limit_query
module.exports.fast = fast_simple_query
module.exports.frequency_query = frequency_query
