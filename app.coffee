express = require("express")
app = express()

async = require("async")
_ = require("lodash")

Knex = require("knex")
Knex.knex = Knex.initialize(
  client: "pg"
  connection:
    localhost: "localhost"
    database: "names"
)
knex = require("knex").knex

queries = require("./lib/queries")

app.use express.static(__dirname + "/public")

app.get "/api/surnames", (req, res) ->

  knex("surnames").where(->
    if [req.query.frequency, req.query.race].every(queries.isUndefined)
      queries.fast(this)
    else
      this.where(->
        queries.frequencyQuery(this, req.query.frequency) 
      )
      .andWhere(->
        queries.raceQuery(this, req.query.race)
      )
  )
  .orderBy(knex.raw("RANDOM()"))
  .limit(queries.limitQuery(req.query.limit))
  .then (query_results) ->
    results = surnames: query_results
    res.json results

app.get "/api/firstnames", (req, res) ->

  # New plan. Create an async series in which the first part of the series is an if statement wrapped around the maxRank function. Then use the callback to run the knex.where here.
  # Also rewrite the queries so that they don't require if statements. Instead they use the sanitizers so that if the query is blank, the AND WHERE is executed but in a way that doesn't actually filter the results.

  async.series([
    (callback) ->

      # Only run this code if both req.query.rank and req.query.gender exist
      unless req.query.rank is `undefined` or req.query.gender is `undefined`
        knex("firstnames_annual").select(knex.raw("max(rank)"))
        .where(->
          queries.yearQuery(this, req.query.year)
        )
        .andWhere(->
          queries.genderQuery(this, req.query.gender)
        )
        .then (result) ->
          # Send the max(rank) to the callback function
          callback(null, result[0].max)
      else
        callback(null)
      ],
      (err, results) ->

        knex("firstnames_annual").where(->
          # Year query
          queries.yearQuery(this, req.query.year)
        )
        .andWhere(->
          queries.genderQuery(this, req.query.gender)
        )
        .andWhere(->
          queries.rankQuery(this, req.query.rank, results[0])
        )
        .orderBy(knex.raw("RANDOM()"))
        .limit(queries.limitQuery(req.query.limit))
        .then (query_results) ->
          results = firstnames: query_results
          res.json results
  )

  # knex("firstnames_annual").where(->
  #   pass = this
    
  #   # Year query must always run
  #   pass = pass.where(->
  #     queries.yearQuery(this, req.query.year)
  #   )

  #   if req.query.gender
  #     pass = pass.where(->
  #       queries.genderQuery(this, req.query.gender.toLowerCase())
  #     )

  #   if req.query.rank and req.query.gender
  #     queryOptions = {'rank': req.query.rank, 'gender': queries.sanitizeGender(req.query.gender), 'year': queries.sanitizeYear(req.query.year)}
      
  #     pass = queries.rankQuery(this, queryOptions)

  #   return pass
  # )
  # .orderBy(knex.raw("RANDOM()"))
  # .limit(queries.limitQuery(req.query.limit))
  # .then (query_results) ->
  #   results = firstnames: query_results
  #   res.json results

# queryProcessor = (obj, req) ->
#   obj.where(->
#     queries.yearQuery(this, req.query.year)
#   )
#   .andWhere(->
#     queries.genderQuery(this, req.query.gender.toLowerCase())
#   )


server = app.listen(process.env.port or 3000, ->
  console.log "Listening on port %d", server.address().port
)



# Convenience Functions

existy = (x) ->
  return x != null

isUndefined = (element, index, array) ->
  return element is `undefined`