# Loading libraries
async = require("async")
_ = require("lodash")
Knex = require("knex")

# Setting up database connection
Knex.knex = Knex.initialize(
  client: "pg"
  connection:
    localhost: "localhost"
    database: "names"
)
knex = require("knex").knex

# Loading Express
express = require("express")
app = express()

# Loading query functions
queries = require("./lib/queries")

# Loading error handler
errorHandler = require("./lib/errorHandler")

# Setting up public directory
app.use express.static(__dirname + "/public")

app.get "/api/surnames", (req, res) ->

  getSurnames(req, (json, error = false) ->
    if error is true
      res.json 400, json
    else
      res.json json
  )

app.get "/api/firstnames", (req, res) ->

  getFirstnames(req, (json, error = false) ->
    if error is true
      res.json 400, json
    else
      res.json json
  )

app.get "/api/names", (req, res) ->
  
  async.parallel(
    [(callback) ->
      getFirstnames(req, (json) ->
        callback(null, json)
      )
    ,
    (callback) ->
      getSurnames(req, (json) ->
        callback(null, json)
      )  
    ],
    (err, results) ->
      errors = []

      _.each results, (result) ->
        if result.errors
          errors = result.errors

      if errors.length > 0
        res.json 400, errors: errors
      else
        cleanedResults = {}
        cleanedResults['names'] = _.filter(_.zip(results[0].firstnames, results[1].surnames), (nameArray) ->
                                    return !_.some(nameArray, _.isUndefined)
                                   )

        if queries.limitQuery(req.query.limit) > cleanedResults['names'].length
          errorHandler.addWarning({message: "Limited Results", description: "The request returned fewer results than the limit. Consider loosening your query conditions."})
        
        if errorHandler.warningsFound() > 0
          cleanedResults['warnings'] = errorHandler.listWarnings()

        res.json cleanedResults
  )

getSurnames = (req, resultsCallback) ->

  knex("surnames").where(->
    if [req.query.frequency, req.query.race].every(queries.isUndefined)
      queries.fast(this)
    else
      this.where(->
        queries.frequencyQuery(this, req.query.frequency, errorHandler) 
      )
      .andWhere(->
        queries.raceQuery(this, req.query.race, errorHandler)
      )
  )
  .orderBy(knex.raw("RANDOM()"))
  .limit(queries.limitQuery(req.query.limit, errorHandler))
  .then( (query_results) ->
    if errorHandler.errorsFound() > 0 
      throw new Error("Errors detected in errorHandler")
    else
    results = surnames: query_results
    resultsCallback(results)
  )
  .catch(Error, (e) ->
    # console.log e
    resultsCallback(errors: errorHandler.listErrors(), true)
    errorHandler.clearErrors()
  )

getFirstnames = (req, resultsCallback) ->

  async.series([
    (callback) ->

      # Only run this code if both req.query.rank and req.query.gender exist
      unless req.query.rank is `undefined` or req.query.gender is `undefined`
        knex("firstnames_annual").select(knex.raw("max(rank)"))
        .where(->
          queries.yearQuery(this, req.query.year)
        )
        .andWhere(->
          queries.genderQuery(this, req.query.gender, errorHandler)
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
          queries.yearQuery(this, req.query.year, errorHandler)
        )
        .andWhere(->
          queries.genderQuery(this, req.query.gender, errorHandler)
        )
        .andWhere(->
          queries.rankQuery(this, req.query.rank, results[0], errorHandler)
        )
        .orderBy(knex.raw("RANDOM()"))
        .limit(queries.limitQuery(req.query.limit, errorHandler))
        .then( (query_results) ->
          if errorHandler.errorsFound() > 0 
            throw new Error("Errors detected in errorHandler")
          else
            results = firstnames: query_results
            resultsCallback results
        )
        .catch(Error, (e) ->
          # console.log e
          resultsCallback errors: errorHandler.listErrors(), true
          errorHandler.clearErrors()
        )
  )

server = app.listen(process.env.port or 3000, ->
  console.log "Listening on port %d", server.address().port
)