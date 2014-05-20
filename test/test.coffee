request = require("superagent")
expect = require("expect.js")
async = require("async")
_ = require("lodash")

describe "Server", ->
  it "responds to basic requests", (done) ->
    request.get("localhost:3000/").end (res) ->
      expect(res).to.exist
      expect(res.status).to.equal 200
      done()

describe "API", ->
  describe "surnames", ->
    it "responds to /api/surnames", (done) ->
      request.get("localhost:3000/api/surnames").end (res) ->
        expect(res).to.exist
        expect(res.status).to.equal 200
        done()

    it "returns a JSON array of 10 names by default", (done) ->
      request.get("localhost:3000/api/surnames").end (res) ->
        expect(res.body).to.exist
        expect(res.body).to.not.be.empty()
        expect(res.body).to.have.key "surnames"
        expect(res.body.surnames).to.be.an Array
        expect(res.body.surnames).to.have.length 10
        done()

    describe "the limit query", ->
      it "changes the number of results", (done) ->
        request.get("localhost:3000/api/surnames?limit=23").end (res) ->
          expect(res.body).to.exist
          expect(res.body.surnames).to.have.length 23
          done()

      it "returns 10 results if the limit is over 100 or under 0", (done) ->
        request.get("localhost:3000/api/surnames?limit=130").end (res) ->
          expect(res.body.surnames).to.have.length 10
          done()

    describe "the frequency query", ->
      it "low returns names with frequencies below 0.1", (done) ->
        request.get("localhost:3000/api/surnames?frequency=low").end (res) ->
          async.each res.body.surnames, (name) ->
            expect(name.frequency).to.be.lessThan 0.1
          done()

      it "medium returns names with frequencies >= 0.06 and < 1", (done) ->
        request.get("localhost:3000/api/surnames?frequency=medium").end (res) ->
          async.each res.body.surnames, (name) ->
            expect(name.frequency).to.be.greaterThan(0.059)
            expect(name.frequency).to.be.lessThan(1)
          done()

      it "high returns names with frequencies >=1", (done) ->
        request.get("localhost:3000/api/surnames?frequency=high").end (res) ->
          async.each res.body.surnames, (name) ->
            expect(name.frequency).to.be.greaterThan(0.99)
          done()

    describe "the racial query", ->
      it "returns names with pctblack above 50 when sent pctblack, 50", (done) ->
        request.get("localhost:3000/api/surnames?race=pctblack&race=50").end (res) ->
          async.each res.body.surnames, (name) ->
            expect(name.pctblack).to.be.greaterThan(50)
          done()

      it "returns names with pctasian above 20 when sent pctasian, 20", (done) ->
        request.get("localhost:3000/api/surnames?race=pctasian&race=20").end (res) ->
          async.each res.body.surnames, (name) ->
            expect(name.pctasian).to.be.greaterThan(20)
          done()

      it "returns names with pctnative above 60 when sent pctnative, 60", (done) ->
        request.get("localhost:3000/api/surnames?race=pctnative&race=60").end (res) ->
          async.each res.body.surnames, (name) ->
            expect(name.pctnative).to.be.greaterThan(60)
          done()

      it "returns names with pctwhite above 90 when sent pctwhite, 90", (done) ->
        request.get("localhost:3000/api/surnames?race=pctwhite&race=90").end (res) ->
          async.each res.body.surnames, (name) ->
            expect(name.pctwhite).to.be.greaterThan(90)
          done()

      it "returns names with pcthispanic above 95 when sent pcthispanic, 95", (done) ->
        request.get("localhost:3000/api/surnames?race=pcthispanic&race=95").end (res) ->
          async.each res.body.surnames, (name) ->
            expect(name.pcthispanic).to.be.greaterThan(95)
          done()

      it "returns results when sent a non-existent race", (done) ->
        request.get("localhost:3000/api/surnames?race=pctdog&race=95").end (res) ->
          expect(res.body).to.exist
          done()

      it "returns results when sent a wrong race number", (done) ->
        request.get("localhost:3000/api/surnames?race=pctwhite&race=dog").end (res) ->
          expect(res.body).to.exist
          done()

  describe "firstnames", ->
    it "responds to /api/firstnames", (done) ->
      request.get("localhost:3000/api/firstnames").end (res) ->
        expect(res).to.exist
        expect(res.status).to.equal 200
        done()

    it "returns a JSON array of 10 names by default", (done) ->
      request.get("localhost:3000/api/firstnames").end (res) ->
        expect(res.body).to.exist
        expect(res.body).to.not.be.empty()
        expect(res.body).to.have.key "firstnames"
        expect(res.body.firstnames).to.be.an Array
        expect(res.body.firstnames).to.have.length 10
        done()

    describe "the year query", ->
      it "returns names from 1985 if set year=1985", (done) ->
        request.get("localhost:3000/api/firstnames?year=1985").end (res) ->
          async.each res.body.firstnames, (name) ->
            expect(name.year).to.eql(1985)
          done()

      it "returns results from year 0 if year is gibberish", (done) ->
        request.get("localhost:3000/api/firstnames?year=boogie").end (res) ->
          async.each res.body.firstnames, (name) ->
            expect(name.year).to.eql(0)
          done()

    describe "the limit query", ->
      it "changes the number of results", (done) ->
        request.get("localhost:3000/api/firstnames?limit=33").end (res) ->
          expect(res.body).to.exist
          expect(res.body.firstnames).to.have.length 33
          done()

      it "returns 10 results if the limit is over 100 or under 0", (done) ->
        request.get("localhost:3000/api/firstnames?limit=229").end (res) ->
          expect(res.body.firstnames).to.have.length 10
          done()

    describe "the gender query", ->
      it "returns a mix of male and female names when left blank", (done) ->
        request.get("localhost:3000/api/firstnames?limit=20").end (res) ->
          genders = []
          _(res.body.firstnames).forEach (name) ->
            genders.push(name.gender)
          genders = _.uniq(genders)
          expect(genders).to.contain("M")
          expect(genders).to.contain("F")
          done()

      it "returns only male names when sent gender=male", (done) ->
        request.get("localhost:3000/api/firstnames?gender=male").end (res) ->
          async.each res.body.firstnames, (name) ->
            expect(name.gender).to.eql("M")
          done()

      it "returns only female names when sent gender=female", (done) ->
        request.get("localhost:3000/api/firstnames?gender=female").end (res) ->
          async.each res.body.firstnames, (name) ->
            expect(name.gender).to.eql("F")
          done()

      it "returns results when gender is set to gibberish", (done) ->
        request.get("localhost:3000/api/firstnames?gender=doggy").end (res) ->
          expect(res.body.firstnames[0].gender).to.exist
          done()