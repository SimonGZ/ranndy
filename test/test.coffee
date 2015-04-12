request = require("superagent")
expect = require("expect.js")
async = require("async")
_ = require("lodash")

describe "Server", ->
  it "responds to basic requests", (done) ->
    request.get("localhost:3000/").end (err, res) ->
      expect(res).to.exist
      expect(res.status).to.equal 200
      done()

describe "API", ->
  describe "surnames", ->
    it "responds to /api/surnames", (done) ->
      request.get("localhost:3000/api/surnames").end (err, res) ->
        expect(res).to.exist
        expect(res.status).to.equal 200
        done()

    it "returns a JSON array of 10 names by default", (done) ->
      request.get("localhost:3000/api/surnames").end (err, res) ->
        expect(res.body).to.exist
        expect(res.body).to.not.be.empty()
        expect(res.body).to.have.key "surnames"
        expect(res.body.surnames).to.be.an Array
        expect(res.body.surnames).to.have.length 10
        done()

    describe "the limit query", ->
      it "changes the number of results", (done) ->
        request.get("localhost:3000/api/surnames?limit=23").end (err, res) ->
          expect(res.body).to.exist
          expect(res.body.surnames).to.have.length 23
          done()

      it "returns an error if the limit is over 100", (done) ->
        request.get("localhost:3000/api/surnames?limit=130").end (err, res) ->
          expect(res.status).to.equal 400
          expect(res.body).to.have.key "errors"
          expect(res.body.errors).to.be.an Array
          expect(res.body.errors[0].code).to.equal 0
          expect(res.body.errors[0].message).to.equal "Invalid limit specified"
          done()

    describe "the frequency query", ->
      it "returns results when sent any", (done) ->
        request.get("localhost:3000/api/surnames?frequency=any").end (err, res) ->
            expect(res.body.surnames).to.have.length 10
            done()

      it "low returns names with frequencies below 0.1", (done) ->
        request.get("localhost:3000/api/surnames?frequency=low").end (err, res) ->
          async.each res.body.surnames, (name) ->
            expect(name.frequency).to.be.lessThan 0.1
          done()

      it "medium returns names with frequencies >= 0.06 and < 1", (done) ->
        request.get("localhost:3000/api/surnames?frequency=medium").end (err, res) ->
          async.each res.body.surnames, (name) ->
            expect(name.frequency).to.be.greaterThan(0.059)
            expect(name.frequency).to.be.lessThan(1)
          done()

      it "high returns names with frequencies >=1", (done) ->
        request.get("localhost:3000/api/surnames?frequency=high").end (err, res) ->
          async.each res.body.surnames, (name) ->
            expect(name.frequency).to.be.greaterThan(0.99)
          done()

      it "returns an error when sent gibberish", (done) ->
        request.get("localhost:3000/api/surnames?frequency=38be").end (err, res) ->
          expect(res.status).to.equal 400
          expect(res.body).to.have.key "errors"
          expect(res.body.errors).to.be.an Array
          expect(res.body.errors[0].code).to.equal 6
          expect(res.body.errors[0].message).to.equal "Invalid frequency specified"
          done()

    describe "the racial query", ->
      it "returns results when sent any", (done) ->
        request.get("localhost:3000/api/surnames?race=any&race=50").end (err, res) ->
            expect(res.body.surnames).to.have.length 10
            done()

      it "returns names with pctblack above 50 when sent pctblack, 50", (done) ->
        request.get("localhost:3000/api/surnames?race=pctblack&race=50").end (err, res) ->
          async.each res.body.surnames, (name) ->
            expect(name.pctblack).to.be.greaterThan(50)
          done()

      it "returns names with pctasian above 20 when sent pctasian, 20", (done) ->
        request.get("localhost:3000/api/surnames?race=pctasian&race=20").end (err, res) ->
          async.each res.body.surnames, (name) ->
            expect(name.pctasian).to.be.greaterThan(20)
          done()

      it "returns names with pctnative above 60 when sent pctnative, 60", (done) ->
        request.get("localhost:3000/api/surnames?race=pctnative&race=60").end (err, res) ->
          async.each res.body.surnames, (name) ->
            expect(name.pctnative).to.be.greaterThan(60)
          done()

      it "returns names with pctwhite above 90 when sent pctwhite, 90", (done) ->
        request.get("localhost:3000/api/surnames?race=pctwhite&race=90").end (err, res) ->
          async.each res.body.surnames, (name) ->
            expect(name.pctwhite).to.be.greaterThan(90)
          done()

      it "returns names with pcthispanic above 95 when sent pcthispanic, 95", (done) ->
        request.get("localhost:3000/api/surnames?race=pcthispanic&race=95").end (err, res) ->
          async.each res.body.surnames, (name) ->
            expect(name.pcthispanic).to.be.greaterThan(95)
          done()

      it "returns an error when sent a non-existent race", (done) ->
        request.get("localhost:3000/api/surnames?race=pctdog&race=95").end (err, res) ->
          expect(res.status).to.equal 400
          expect(res.body).to.have.key "errors"
          expect(res.body.errors).to.be.an Array
          expect(res.body.errors[0].code).to.equal 4
          expect(res.body.errors[0].message).to.equal "Invalid race specified"
          done()

      it "returns an error when sent a wrong race number", (done) ->
        request.get("localhost:3000/api/surnames?race=pctwhite&race=dog").end (err, res) ->
          expect(res.status).to.equal 400
          expect(res.body).to.have.key "errors"
          expect(res.body.errors).to.be.an Array
          expect(res.body.errors[0].code).to.equal 5
          expect(res.body.errors[0].message).to.equal "Invalid race percent specified"
          done()

      it "returns an error when sent a race percent over 99", (done) ->
        request.get("localhost:3000/api/surnames?race=pctwhite&race=102").end (err, res) ->
          expect(res.status).to.equal 400
          expect(res.body).to.have.key "errors"
          expect(res.body.errors).to.be.an Array
          expect(res.body.errors[0].code).to.equal 5
          expect(res.body.errors[0].message).to.equal "Invalid race percent specified"
          done()

    describe "the starts with query", ->
      it "returns names starting with j if sent sstartswith=j", (done) ->
        request.get("localhost:3000/api/surnames?sstartswith=j").end (err, res) ->
          expect(res.body.surnames).to.not.be.empty()
          async.each res.body.surnames, (name) ->
            expect(name.name.charAt(0)).to.eql('J')
          done()

      it "returns names starting with ka if sent sstartswith=ka", (done) ->
        request.get("localhost:3000/api/surnames?sstartswith=ka").end (err, res) ->
          expect(res.body.surnames).to.not.be.empty()
          async.each res.body.surnames, (name) ->
            expect(name.name.charAt(0)).to.eql('K')
            expect(name.name.charAt(1)).to.eql('a')
          done()

      it "returns an error when sent non-letters", (done) ->
        request.get("localhost:3000/api/surnames?sstartswith=D7*,;3a").end (err, res) ->
          expect(res.status).to.equal 400
          expect(res.body).to.have.key "errors"
          expect(res.body.errors).to.be.an Array
          expect(res.body.errors[0].code).to.equal 7
          expect(res.body.errors[0].message).to.equal "Invalid startswith specified"
          done()

      describe "starts with special features", ->
        it "returns names NOT starting with C when sent sstartswith=c*", (done) ->
          request.get("localhost:3000/api/surnames?sstartswith=c*&limit=50").end (err, res) ->
            expect(res.body.surnames).to.not.be.empty()
            async.each res.body.surnames, (name) ->
              expect(name.name.charAt(0)).to.not.eql('C')
            done()

        it "returns names NOT starting with P and S when sent sstartswith=p*,s*", (done) ->
          request.get("localhost:3000/api/surnames?sstartswith=p*,s*&limit=50").end (err, res) ->
            expect(res.body.surnames).to.not.be.empty()
            async.each res.body.surnames, (name) ->
              expect(name.name.charAt(0)).to.not.eql('P')
              expect(name.name.charAt(0)).to.not.eql('S')
            done()

        it "returns Ganz if set sstartswith=ganz^", (done) ->
          request.get("localhost:3000/api/surnames?sstartswith=ganz^").end (err, res) ->
            expect(res.body.surnames).to.not.be.empty()
            async.each res.body.surnames, (name) ->
              expect(name.name).to.eql('Ganz')
            done()        

  describe "firstnames", ->
    it "responds to /api/firstnames", (done) ->
      request.get("localhost:3000/api/firstnames").end (err, res) ->
        expect(res).to.exist
        expect(res.status).to.equal 200
        done()

    it "returns a JSON array of 10 names by default", (done) ->
      request.get("localhost:3000/api/firstnames").end (err, res) ->
        expect(res.body).to.exist
        expect(res.body).to.not.be.empty()
        expect(res.body).to.have.key "firstnames"
        expect(res.body.firstnames).to.be.an Array
        expect(res.body.firstnames).to.have.length 10
        done()

    describe "the year query", ->
      it "returns names from 1985 if set year=1985", (done) ->
        request.get("localhost:3000/api/firstnames?year=1985").end (err, res) ->
          async.each res.body.firstnames, (name) ->
            expect(name.year).to.eql(1985)
          done()

      it "returns an error if year is gibberish", (done) ->
        request.get("localhost:3000/api/firstnames?year=boogie").end (err, res) ->
          expect(res.status).to.equal 400
          expect(res.body).to.have.key "errors"
          expect(res.body.errors).to.be.an Array
          expect(res.body.errors[0].code).to.equal 1
          expect(res.body.errors[0].message).to.equal "Invalid year specified"
          done()

    describe "the limit query", ->
      it "changes the number of results", (done) ->
        request.get("localhost:3000/api/firstnames?limit=33").end (err, res) ->
          expect(res.body).to.exist
          expect(res.body.firstnames).to.have.length 33
          done()

      it "returns an error if the limit is under 0", (done) ->
        request.get("localhost:3000/api/firstnames?limit=-5").end (err, res) ->
          expect(res.status).to.equal 400
          expect(res.body).to.have.key "errors"
          expect(res.body.errors).to.be.an Array
          expect(res.body.errors[0].code).to.equal 0
          expect(res.body.errors[0].message).to.equal "Invalid limit specified"
          done()

    describe "the gender query", ->
      it "returns a mix of male and female names when left blank", (done) ->
        request.get("localhost:3000/api/firstnames?limit=20").end (err, res) ->
          genders = []
          _(res.body.firstnames).forEach (name) ->
            genders.push(name.gender)
          genders = _.uniq(genders)
          expect(genders).to.contain("M")
          expect(genders).to.contain("F")
          done()

      it "returns a mix of male and female names when sent any", (done) ->
        request.get("localhost:3000/api/firstnames?limit=20&gender=any").end (err, res) ->
          genders = []
          _(res.body.firstnames).forEach (name) ->
            genders.push(name.gender)
          genders = _.uniq(genders)
          expect(genders).to.contain("M")
          expect(genders).to.contain("F")
          done()

      it "returns only male names when sent gender=male", (done) ->
        request.get("localhost:3000/api/firstnames?gender=male").end (err, res) ->
          async.each res.body.firstnames, (name) ->
            expect(name.gender).to.eql("M")
          done()

      it "returns only female names when sent gender=female", (done) ->
        request.get("localhost:3000/api/firstnames?gender=female").end (err, res) ->
          async.each res.body.firstnames, (name) ->
            expect(name.gender).to.eql("F")
          done()

      it "returns an error when gender is set to gibberish", (done) ->
        request.get("localhost:3000/api/firstnames?gender=doggy").end (err, res) ->
          expect(res.status).to.equal 400
          expect(res.body).to.have.key "errors"
          expect(res.body.errors).to.be.an Array
          expect(res.body.errors[0].code).to.equal 2
          expect(res.body.errors[0].message).to.equal "Invalid gender specified"
          done()

    describe "the rank query", ->
      it "returns results when sent any", (done) ->
        request.get("localhost:3000/api/firstnames?rank=any&gender=male&year=1880").end (err, res) ->
            expect(res.body.firstnames).to.have.length 10
            done()

      describe "max(rank) less than 500", ->
        it "high returns names from the top 125", (done) ->
          request.get("localhost:3000/api/firstnames?rank=high&gender=male&year=1880").end (err, res) ->
            async.each res.body.firstnames, (name) ->
              expect(name.rank).to.be.lessThan(126)
            done()

        it "low returns names ranked greater than 125", (done) ->
          request.get("localhost:3000/api/firstnames?rank=low&gender=male&year=1902").end (err, res) ->
            async.each res.body.firstnames, (name) ->
              expect(name.rank).to.be.greaterThan(125)
            done()

        it "returns an error when sent gibberish", (done) ->
          request.get("localhost:3000/api/firstnames?rank=dkd8&gender=female&year=1900").end (err, res) ->
            expect(res.status).to.equal 400
            expect(res.body).to.have.key "errors"
            expect(res.body.errors).to.be.an Array
            expect(res.body.errors[0].code).to.equal 3
            expect(res.body.errors[0].message).to.equal "Invalid rank specified"
            done()

      describe "max(rank) greater than 500", ->
        it "high returns names from the top 300", (done) ->
          request.get("localhost:3000/api/firstnames?rank=high&gender=female&year=1980").end (err, res) ->
            async.each res.body.firstnames, (name) ->
              expect(name.rank).to.be.lessThan(301)
            done()

        it "low returns names ranked greater than 300", (done) ->
          request.get("localhost:3000/api/firstnames?rank=low&gender=female&year=2002").end (err, res) ->
            async.each res.body.firstnames, (name) ->
              expect(name.rank).to.be.greaterThan(300)
            done()

        it "returns an error when sent gibberish", (done) ->
          request.get("localhost:3000/api/firstnames?rank=dkd8&gender=female&year=2002").end (err, res) ->
            expect(res.status).to.equal 400
            expect(res.body).to.have.key "errors"
            expect(res.body.errors).to.be.an Array
            expect(res.body.errors[0].code).to.equal 3
            expect(res.body.errors[0].message).to.equal "Invalid rank specified"
            done()

      describe "when in year zero", ->
        it "high returns names from the top 800", (done) ->
          request.get("localhost:3000/api/firstnames?rank=high&gender=female&year=0").end (err, res) ->
            async.each res.body.firstnames, (name) ->
              expect(name.rank).to.be.lessThan(801)
            done()

        it "low returns names ranked greater than 800", (done) ->
          request.get("localhost:3000/api/firstnames?rank=low&gender=female&year=0&limit=100").end (err, res) ->
            async.each res.body.firstnames, (name) ->
              expect(name.rank).to.be.greaterThan(800)
            done()

    describe "the starts with query", ->
      it "returns names starting with s if set fstartswith=s", (done) ->
        request.get("localhost:3000/api/firstnames?fstartswith=s").end (err, res) ->
          expect(res.body.firstnames).to.not.be.empty()
          async.each res.body.firstnames, (name) ->
            expect(name.name.charAt(0)).to.eql('S')
          done()

      it "returns names starting with da if set fstartswith=da", (done) ->
        request.get("localhost:3000/api/firstnames?fstartswith=da").end (err, res) ->
          expect(res.body.firstnames).to.not.be.empty()
          async.each res.body.firstnames, (name) ->
            expect(name.name.charAt(0)).to.eql('D')
            expect(name.name.charAt(1)).to.eql('a')
          done()

      it "returns Jason if set fstartswith=jason^", (done) ->
        request.get("localhost:3000/api/firstnames?fstartswith=jason^&gender=male").end (err, res) ->
          expect(res.body.firstnames).to.not.be.empty()
          async.each res.body.firstnames, (name) ->
            expect(name.name).to.eql('Jason')
          done()        

      it "returns an error when sent non-letters", (done) ->
        request.get("localhost:3000/api/firstnames?fstartswith=D4a").end (err, res) ->
          expect(res.status).to.equal 400
          expect(res.body).to.have.key "errors"
          expect(res.body.errors).to.be.an Array
          expect(res.body.errors[0].code).to.equal 7
          expect(res.body.errors[0].message).to.equal "Invalid startswith specified"
          done()

      describe "starts with special features", ->
        it "returns names NOT starting with C when sent fstartswith=c*", (done) ->
          request.get("localhost:3000/api/firstnames?fstartswith=c*&limit=50").end (err, res) ->
            expect(res.body.firstnames).to.not.be.empty()
            async.each res.body.firstnames, (name) ->
              expect(name.name.charAt(0)).to.not.eql('C')
            done()

        it "returns names NOT starting with P and S when sent fstartswith=p*,s*", (done) ->
          request.get("localhost:3000/api/firstnames?fstartswith=p*,s*&limit=50").end (err, res) ->
            expect(res.body.firstnames).to.not.be.empty()
            async.each res.body.firstnames, (name) ->
              expect(name.name.charAt(0)).to.not.eql('P')
              expect(name.name.charAt(0)).to.not.eql('S')
            done()

  describe "names", ->
    it "responds to /api/names", (done) ->
      request.get("localhost:3000/api/names").end (err, res) ->
        expect(res).to.exist
        expect(res.status).to.equal 200
        done()

    it "should not have any warnings when accessed with default settings", (done) ->
      request.get("localhost:3000/api/names").end (err, res) ->
        expect(res).to.exist
        expect(res.body).not.to.have.key "warnings"
        done()

    it "provides warning if fewer than the requested number of names are available", (done) ->
      request.get("localhost:3000/api/names?limit=100&rank=high&frequency=high&gender=female&year=1880&race=pctnative&race=50").end (err, res) ->
        expect(res.body).to.have.key "warnings"
        done()