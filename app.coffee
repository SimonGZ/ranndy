# Loading libraries
async = require("async")
_ = require("lodash")
knex = require("knex")({
  client: "pg"
  connection:
    localhost: "localhost"
    user: "names"
    password: "***REMOVED***"
    database: "names"
  })

# Loading Express
express = require("express")
app = express()

# Loading query functions
queries = require("./lib/queries")

# Loading error handler
errorHandler = require("./lib/errorHandler")

# Setting up public directory
app.use express.static(__dirname + "/public")

#Convenience Functions
randomIntFromInterval = (min,max) ->
  Math.floor(Math.random()*(max-min+1)+min)

app.get "/api/surnames", (req, res) ->

  getSurnames(req, (json, error = false) ->
    if error is true
      console.log('error happening')
      res.status(400).json(json)
    else
      console.log('error not happening')
      res.json json
      errorHandler.clearErrors()
      errorHandler.clearWarnings()
  )

app.get "/api/firstnames", (req, res) ->

  getFirstnames(req, (json, error = false) ->
    if error is true
      res.status(400).json(json)
    else
      res.json json
      errorHandler.clearErrors()
      errorHandler.clearWarnings()
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
        
        # Old method that cut down the array so that no entries were null
        # cleanedResults['names'] = _.filter(_.zip(results[0].firstnames, results[1].surnames), (nameArray) ->
                                    # return !_.some(nameArray, _.isUndefined)
                                   # )
        
        # Send a warning if the number of results is below the limit
        if queries.limitQuery(req.query.limit) > results[0].firstnames.length or queries.limitQuery(req.query.limit) > results[1].surnames.length
          errorHandler.addWarning({message: "Limited Results", description: "The request returned fewer results than the limit. Consider loosening your query conditions."})
        
        if errorHandler.warningsFound() > 0
          cleanedResults['warnings'] = errorHandler.listWarnings()

        # If the first element of the array is null, replace it with the requested name
        if _.isUndefined results[0].firstnames[0]
          results[0].firstnames[0] = {'name': queries.properCase(req.query.fstartswith.replace('^', ''))}
        if _.isUndefined results[1].surnames[0]
          results[1].surnames[0] = {'name': queries.properCase(req.query.sstartswith.replace('^', ''))}

        # Note the length of the arrays for use in random generator
        firstMax = results[0].firstnames.length - 1
        surMax = results[1].surnames.length - 1

        # Create a "cleaned" array by zipping the two arrays into one and replacing null entries with a random earlier entry in the same array
        cleanedResults['names'] = _.filter(_.zip(results[0].firstnames, results[1].surnames), (nameArray) ->
                                    if _.isUndefined nameArray[0]
                                      nameArray[0] = results[0].firstnames[randomIntFromInterval(0,firstMax)]
                                    if _.isUndefined nameArray[1]
                                      nameArray[1] = results[1].surnames[randomIntFromInterval(0,surMax)]
                                    return nameArray
                                   )


        res.json cleanedResults
        errorHandler.clearErrors()
        errorHandler.clearWarnings()
  )

getSurnames = (req, resultsCallback) ->
  console.log("running getSurnames")

  knex("surnames").where(->
    if [req.query.frequency, req.query.race, req.query.sstartswith].every(queries.isUndefined)
      queries.fast(this, knex)
    else
      this.where(->
        queries.startsWithQuery(this, req.query.sstartswith, errorHandler)
        )
        .andWhere(->
          queries.frequencyQuery(this, req.query.frequency, errorHandler) 
        )
        .andWhere(->
          queries.raceQuery(this, req.query.race, errorHandler)
      )
  )
  .orderByRaw("RANDOM()")
  .limit(queries.limitQuery(req.query.limit, errorHandler))
  .then( (query_results) ->
    console.log("now in then function")
    if errorHandler.errorsFound() > 0 
      console.log("errors found in error handler")
      throw new Error("Errors detected in errorHandler")
    else
      results = surnames: query_results
      resultsCallback(results)
  )
  .catch( (e) ->
    # console.log "Caught Surnames Error: #{e}"
    resultsCallback(errors: errorHandler.listErrors(), true)
    errorHandler.clearErrors()
    errorHandler.clearWarnings()
  )

getFirstnames = (req, resultsCallback) ->

  async.series([
    (callback) ->

      # Only run this code if both req.query.rank and req.query.gender exist
      unless req.query.rank is `undefined` or req.query.gender is `undefined`
        knex("firstnames_annual").max("rank")
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
          queries.startsWithQuery(this, req.query.fstartswith, errorHandler)
        )
        .andWhere(->
          queries.genderQuery(this, req.query.gender, errorHandler)
        )
        .andWhere(->
          queries.rankQuery(this, req.query.rank, results[0], errorHandler)
        )
        .orderByRaw("RANDOM()")
        .limit(queries.limitQuery(req.query.limit, errorHandler))
        .then( (query_results) ->
          if errorHandler.errorsFound() > 0 
            throw new Error("Errors detected in errorHandler")
          else
            results = firstnames: query_results
            resultsCallback results
        )
        .catch( (e) ->
          # console.log "Caught Firstnames Error: #{e}"
          # NOTE: The following line can cause crashes from double resultsCallbacks when there's an unexpected error. Not sure how to fix.
          resultsCallback(errors: errorHandler.listErrors(), true)
          errorHandler.clearErrors()
          errorHandler.clearWarnings()
        )
  )

server = app.listen(process.env.port or 3000, ->
  console.log "Listening on port %d", server.address().port
)
