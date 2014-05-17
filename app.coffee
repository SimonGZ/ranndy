express = require("express")
app = express()

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
      pass = this
      if req.query.frequency
        pass = pass.where(->
          queries.frequencyQuery(this, req.query.frequency) 
        )
      if req.query.race
        pass = pass.where(->
          queries.raceQuery(this, req.query.race)
        )
      return pass
  )
  .orderBy(knex.raw("RANDOM()"))
  .limit(queries.limitQuery(req.query.limit))
  .then (query_results) ->
    results = surnames: query_results
    res.json results

app.get "/api/firstnames", (req, res) ->

  knex("firstnames_annual").where(->
    this.where({year: 0}) 
  )
  .limit(10)
  .then (query_results) ->
    results = firstnames: query_results
    res.json results

server = app.listen(process.env.port or 3000, ->
  console.log "Listening on port %d", server.address().port
)