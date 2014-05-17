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
  console.log "Request is #{req.query.limit}"
  console.log "Function returns #{queries.limit_query req.query.limit}"

  knex("surnames").where(->
    if req.query.frequency is `undefined`
      queries.fast this
    else if req.query.frequency
      queries.frequency_query this, req.query.frequency
  ).limit(queries.limit_query req.query.limit)
  .then (query_results) ->
    results = surnames: query_results
    res.json results


server = app.listen(process.env.port or 3000, ->
  console.log "Listening on port %d", server.address().port
)