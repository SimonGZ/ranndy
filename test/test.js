// Generated by CoffeeScript 1.7.1
(function() {
  var async, expect, request, _;

  request = require("superagent");

  expect = require("expect.js");

  async = require("async");

  _ = require("lodash");

  describe("Server", function() {
    return it("responds to basic requests", function(done) {
      return request.get("localhost:3000/").end(function(res) {
        expect(res).to.exist;
        expect(res.status).to.equal(200);
        return done();
      });
    });
  });

  describe("API", function() {
    describe("surnames", function() {
      it("responds to /api/surnames", function(done) {
        return request.get("localhost:3000/api/surnames").end(function(res) {
          expect(res).to.exist;
          expect(res.status).to.equal(200);
          return done();
        });
      });
      it("returns a JSON array of 10 names by default", function(done) {
        return request.get("localhost:3000/api/surnames").end(function(res) {
          expect(res.body).to.exist;
          expect(res.body).to.not.be.empty();
          expect(res.body).to.have.key("surnames");
          expect(res.body.surnames).to.be.an(Array);
          expect(res.body.surnames).to.have.length(10);
          return done();
        });
      });
      describe("the limit query", function() {
        it("changes the number of results", function(done) {
          return request.get("localhost:3000/api/surnames?limit=23").end(function(res) {
            expect(res.body).to.exist;
            expect(res.body.surnames).to.have.length(23);
            return done();
          });
        });
        return it("returns an error if the limit is over 100", function(done) {
          return request.get("localhost:3000/api/surnames?limit=130").end(function(res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(0);
            expect(res.body.errors[0].message).to.equal("Invalid limit specified");
            return done();
          });
        });
      });
      describe("the frequency query", function() {
        it("returns results when sent any", function(done) {
          return request.get("localhost:3000/api/surnames?frequency=any").end(function(res) {
            expect(res.body.surnames).to.have.length(10);
            return done();
          });
        });
        it("low returns names with frequencies below 0.1", function(done) {
          return request.get("localhost:3000/api/surnames?frequency=low").end(function(res) {
            async.each(res.body.surnames, function(name) {
              return expect(name.frequency).to.be.lessThan(0.1);
            });
            return done();
          });
        });
        it("medium returns names with frequencies >= 0.06 and < 1", function(done) {
          return request.get("localhost:3000/api/surnames?frequency=medium").end(function(res) {
            async.each(res.body.surnames, function(name) {
              expect(name.frequency).to.be.greaterThan(0.059);
              return expect(name.frequency).to.be.lessThan(1);
            });
            return done();
          });
        });
        it("high returns names with frequencies >=1", function(done) {
          return request.get("localhost:3000/api/surnames?frequency=high").end(function(res) {
            async.each(res.body.surnames, function(name) {
              return expect(name.frequency).to.be.greaterThan(0.99);
            });
            return done();
          });
        });
        return it("returns an error when sent gibberish", function(done) {
          return request.get("localhost:3000/api/surnames?frequency=38be").end(function(res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(6);
            expect(res.body.errors[0].message).to.equal("Invalid frequency specified");
            return done();
          });
        });
      });
      describe("the racial query", function() {
        it("returns results when sent any", function(done) {
          return request.get("localhost:3000/api/surnames?race=any&race=50").end(function(res) {
            expect(res.body.surnames).to.have.length(10);
            return done();
          });
        });
        it("returns names with pctblack above 50 when sent pctblack, 50", function(done) {
          return request.get("localhost:3000/api/surnames?race=pctblack&race=50").end(function(res) {
            async.each(res.body.surnames, function(name) {
              return expect(name.pctblack).to.be.greaterThan(50);
            });
            return done();
          });
        });
        it("returns names with pctasian above 20 when sent pctasian, 20", function(done) {
          return request.get("localhost:3000/api/surnames?race=pctasian&race=20").end(function(res) {
            async.each(res.body.surnames, function(name) {
              return expect(name.pctasian).to.be.greaterThan(20);
            });
            return done();
          });
        });
        it("returns names with pctnative above 60 when sent pctnative, 60", function(done) {
          return request.get("localhost:3000/api/surnames?race=pctnative&race=60").end(function(res) {
            async.each(res.body.surnames, function(name) {
              return expect(name.pctnative).to.be.greaterThan(60);
            });
            return done();
          });
        });
        it("returns names with pctwhite above 90 when sent pctwhite, 90", function(done) {
          return request.get("localhost:3000/api/surnames?race=pctwhite&race=90").end(function(res) {
            async.each(res.body.surnames, function(name) {
              return expect(name.pctwhite).to.be.greaterThan(90);
            });
            return done();
          });
        });
        it("returns names with pcthispanic above 95 when sent pcthispanic, 95", function(done) {
          return request.get("localhost:3000/api/surnames?race=pcthispanic&race=95").end(function(res) {
            async.each(res.body.surnames, function(name) {
              return expect(name.pcthispanic).to.be.greaterThan(95);
            });
            return done();
          });
        });
        it("returns an error when sent a non-existent race", function(done) {
          return request.get("localhost:3000/api/surnames?race=pctdog&race=95").end(function(res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(4);
            expect(res.body.errors[0].message).to.equal("Invalid race specified");
            return done();
          });
        });
        it("returns an error when sent a wrong race number", function(done) {
          return request.get("localhost:3000/api/surnames?race=pctwhite&race=dog").end(function(res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(5);
            expect(res.body.errors[0].message).to.equal("Invalid race percent specified");
            return done();
          });
        });
        return it("returns an error when sent a race percent over 99", function(done) {
          return request.get("localhost:3000/api/surnames?race=pctwhite&race=102").end(function(res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(5);
            expect(res.body.errors[0].message).to.equal("Invalid race percent specified");
            return done();
          });
        });
      });
      return describe("the starts with query", function() {
        it("returns names starting with j if set sstartswith=j", function(done) {
          return request.get("localhost:3000/api/surnames?sstartswith=j").end(function(res) {
            expect(res.body.surnames).to.not.be.empty();
            async.each(res.body.surnames, function(name) {
              return expect(name.name.charAt(0)).to.eql('J');
            });
            return done();
          });
        });
        it("returns names starting with ka if set sstartswith=ka", function(done) {
          return request.get("localhost:3000/api/surnames?sstartswith=ka").end(function(res) {
            expect(res.body.surnames).to.not.be.empty();
            async.each(res.body.surnames, function(name) {
              expect(name.name.charAt(0)).to.eql('K');
              return expect(name.name.charAt(1)).to.eql('a');
            });
            return done();
          });
        });
        return it("returns an error when sent non-letters", function(done) {
          return request.get("localhost:3000/api/surnames?sstartswith=D^73a").end(function(res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(7);
            expect(res.body.errors[0].message).to.equal("Invalid startswith specified");
            return done();
          });
        });
      });
    });
    describe("firstnames", function() {
      it("responds to /api/firstnames", function(done) {
        return request.get("localhost:3000/api/firstnames").end(function(res) {
          expect(res).to.exist;
          expect(res.status).to.equal(200);
          return done();
        });
      });
      it("returns a JSON array of 10 names by default", function(done) {
        return request.get("localhost:3000/api/firstnames").end(function(res) {
          expect(res.body).to.exist;
          expect(res.body).to.not.be.empty();
          expect(res.body).to.have.key("firstnames");
          expect(res.body.firstnames).to.be.an(Array);
          expect(res.body.firstnames).to.have.length(10);
          return done();
        });
      });
      describe("the year query", function() {
        it("returns names from 1985 if set year=1985", function(done) {
          return request.get("localhost:3000/api/firstnames?year=1985").end(function(res) {
            async.each(res.body.firstnames, function(name) {
              return expect(name.year).to.eql(1985);
            });
            return done();
          });
        });
        return it("returns an error if year is gibberish", function(done) {
          return request.get("localhost:3000/api/firstnames?year=boogie").end(function(res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(1);
            expect(res.body.errors[0].message).to.equal("Invalid year specified");
            return done();
          });
        });
      });
      describe("the limit query", function() {
        it("changes the number of results", function(done) {
          return request.get("localhost:3000/api/firstnames?limit=33").end(function(res) {
            expect(res.body).to.exist;
            expect(res.body.firstnames).to.have.length(33);
            return done();
          });
        });
        return it("returns an error if the limit is under 0", function(done) {
          return request.get("localhost:3000/api/firstnames?limit=-5").end(function(res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(0);
            expect(res.body.errors[0].message).to.equal("Invalid limit specified");
            return done();
          });
        });
      });
      describe("the gender query", function() {
        it("returns a mix of male and female names when left blank", function(done) {
          return request.get("localhost:3000/api/firstnames?limit=20").end(function(res) {
            var genders;
            genders = [];
            _(res.body.firstnames).forEach(function(name) {
              return genders.push(name.gender);
            });
            genders = _.uniq(genders);
            expect(genders).to.contain("M");
            expect(genders).to.contain("F");
            return done();
          });
        });
        it("returns a mix of male and female names when sent any", function(done) {
          return request.get("localhost:3000/api/firstnames?limit=20&gender=any").end(function(res) {
            var genders;
            genders = [];
            _(res.body.firstnames).forEach(function(name) {
              return genders.push(name.gender);
            });
            genders = _.uniq(genders);
            expect(genders).to.contain("M");
            expect(genders).to.contain("F");
            return done();
          });
        });
        it("returns only male names when sent gender=male", function(done) {
          return request.get("localhost:3000/api/firstnames?gender=male").end(function(res) {
            async.each(res.body.firstnames, function(name) {
              return expect(name.gender).to.eql("M");
            });
            return done();
          });
        });
        it("returns only female names when sent gender=female", function(done) {
          return request.get("localhost:3000/api/firstnames?gender=female").end(function(res) {
            async.each(res.body.firstnames, function(name) {
              return expect(name.gender).to.eql("F");
            });
            return done();
          });
        });
        return it("returns an error when gender is set to gibberish", function(done) {
          return request.get("localhost:3000/api/firstnames?gender=doggy").end(function(res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(2);
            expect(res.body.errors[0].message).to.equal("Invalid gender specified");
            return done();
          });
        });
      });
      describe("the rank query", function() {
        it("returns results when sent any", function(done) {
          return request.get("localhost:3000/api/firstnames?rank=any&gender=male&year=1880").end(function(res) {
            expect(res.body.firstnames).to.have.length(10);
            return done();
          });
        });
        describe("max(rank) less than 500", function() {
          it("high returns names from the top 75", function(done) {
            return request.get("localhost:3000/api/firstnames?rank=high&gender=male&year=1880").end(function(res) {
              async.each(res.body.firstnames, function(name) {
                return expect(name.rank).to.be.lessThan(76);
              });
              return done();
            });
          });
          it("medium returns names ranked between 75 and 125", function(done) {
            return request.get("localhost:3000/api/firstnames?rank=medium&gender=male&year=1900").end(function(res) {
              async.each(res.body.firstnames, function(name) {
                expect(name.rank).to.be.greaterThan(75);
                return expect(name.rank).to.be.lessThan(126);
              });
              return done();
            });
          });
          it("low returns names ranked greater than 125", function(done) {
            return request.get("localhost:3000/api/firstnames?rank=low&gender=male&year=1902").end(function(res) {
              async.each(res.body.firstnames, function(name) {
                return expect(name.rank).to.be.greaterThan(125);
              });
              return done();
            });
          });
          return it("returns an error when sent gibberish", function(done) {
            return request.get("localhost:3000/api/firstnames?rank=dkd8&gender=female&year=1900").end(function(res) {
              expect(res.status).to.equal(400);
              expect(res.body).to.have.key("errors");
              expect(res.body.errors).to.be.an(Array);
              expect(res.body.errors[0].code).to.equal(3);
              expect(res.body.errors[0].message).to.equal("Invalid rank specified");
              return done();
            });
          });
        });
        return describe("max(rank) greater than 500", function() {
          it("high returns names from the top 150", function(done) {
            return request.get("localhost:3000/api/firstnames?rank=high&gender=female&year=1980").end(function(res) {
              async.each(res.body.firstnames, function(name) {
                return expect(name.rank).to.be.lessThan(151);
              });
              return done();
            });
          });
          it("medium returns names ranked between 150 and 300", function(done) {
            return request.get("localhost:3000/api/firstnames?rank=medium&gender=male&year=1990").end(function(res) {
              async.each(res.body.firstnames, function(name) {
                expect(name.rank).to.be.greaterThan(150);
                return expect(name.rank).to.be.lessThan(301);
              });
              return done();
            });
          });
          it("low returns names ranked greater than 300", function(done) {
            return request.get("localhost:3000/api/firstnames?rank=low&gender=female&year=2002").end(function(res) {
              async.each(res.body.firstnames, function(name) {
                return expect(name.rank).to.be.greaterThan(300);
              });
              return done();
            });
          });
          return it("returns an error when sent gibberish", function(done) {
            return request.get("localhost:3000/api/firstnames?rank=dkd8&gender=female&year=2002").end(function(res) {
              expect(res.status).to.equal(400);
              expect(res.body).to.have.key("errors");
              expect(res.body.errors).to.be.an(Array);
              expect(res.body.errors[0].code).to.equal(3);
              expect(res.body.errors[0].message).to.equal("Invalid rank specified");
              return done();
            });
          });
        });
      });
      return describe("the starts with query", function() {
        it("returns names starting with s if set fstartswith=s", function(done) {
          return request.get("localhost:3000/api/firstnames?fstartswith=s").end(function(res) {
            expect(res.body.firstnames).to.not.be.empty();
            async.each(res.body.firstnames, function(name) {
              return expect(name.name.charAt(0)).to.eql('S');
            });
            return done();
          });
        });
        it("returns names starting with da if set fstartswith=da", function(done) {
          return request.get("localhost:3000/api/firstnames?fstartswith=da").end(function(res) {
            expect(res.body.firstnames).to.not.be.empty();
            async.each(res.body.firstnames, function(name) {
              expect(name.name.charAt(0)).to.eql('D');
              return expect(name.name.charAt(1)).to.eql('a');
            });
            return done();
          });
        });
        return it("returns an error when sent non-letters", function(done) {
          return request.get("localhost:3000/api/firstnames?fstartswith=D4a").end(function(res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(7);
            expect(res.body.errors[0].message).to.equal("Invalid startswith specified");
            return done();
          });
        });
      });
    });
    return describe("names", function() {
      it("responds to /api/names", function(done) {
        return request.get("localhost:3000/api/names").end(function(res) {
          expect(res).to.exist;
          expect(res.status).to.equal(200);
          return done();
        });
      });
      it("should not have any warnings when accessed with default settings", function(done) {
        return request.get("localhost:3000/api/names").end(function(res) {
          expect(res).to.exist;
          expect(res.body).not.to.have.key("warnings");
          return done();
        });
      });
      return it("provides warning if fewer than the requested number of names are available", function(done) {
        return request.get("localhost:3000/api/names?limit=100&rank=high&frequency=high&gender=female&year=1880&race=any&race=50").end(function(res) {
          expect(res.body).to.have.key("warnings");
          return done();
        });
      });
    });
  });

}).call(this);
