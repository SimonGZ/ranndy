const request = require("superagent");
const expect = require("expect.js");
const async = require("async");
const _ = require("lodash");

describe("Server", () =>
  it("responds to basic requests", function (done) {
    request.get("localhost:3000/").end(function (err, res) {
      expect(res).to.exist;
      expect(res.status).to.equal(200);
      done();
    });
  }));

describe("API", function () {
  describe("surnames", function () {
    it("responds to /api/surnames", function (done) {
      request.get("localhost:3000/api/surnames").end(function (err, res) {
        expect(res).to.exist;
        expect(res.status).to.equal(200);
        done();
      });
    });

    it("returns a JSON array of 10 names by default", function (done) {
      request.get("localhost:3000/api/surnames").end(function (err, res) {
        expect(res.body).to.exist;
        expect(res.body).to.not.be.empty();
        expect(res.body).to.have.key("surnames");
        expect(res.body.surnames).to.be.an(Array);
        expect(res.body.surnames).to.have.length(10);
        done();
      });
    });

    describe("the limit query", function () {
      it("changes the number of results", function (done) {
        request
          .get("localhost:3000/api/surnames?limit=23")
          .end(function (err, res) {
            expect(res.body).to.exist;
            expect(res.body.surnames).to.have.length(23);
            done();
          });
      });

      it("returns an error if the limit is over 100", function (done) {
        request
          .get("localhost:3000/api/surnames?limit=130")
          .end(function (err, res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(0);
            expect(res.body.errors[0].message).to.equal(
              "Invalid limit specified",
            );
            done();
          });
      });
    });

    describe("the frequency query", function () {
      it("returns results when sent any", function (done) {
        request
          .get("localhost:3000/api/surnames?frequency=any")
          .end(function (err, res) {
            expect(res.body.surnames).to.have.length(10);
            done();
          });
      });

      it("low returns names with frequencies below 0.1", function (done) {
        request
          .get("localhost:3000/api/surnames?frequency=low")
          .end(function (err, res) {
            async.each(res.body.surnames, (name) =>
              expect(name.frequency).to.be.lessThan(0.1),
            );
            done();
          });
      });

      it("medium returns names with frequencies >= 0.06 and < 1", function (done) {
        request
          .get("localhost:3000/api/surnames?frequency=medium")
          .end(function (err, res) {
            async.each(res.body.surnames, function (name) {
              expect(name.frequency).to.be.greaterThan(0.059);
              expect(name.frequency).to.be.lessThan(1);
            });
            done();
          });
      });

      it("high returns names with frequencies >=1", function (done) {
        request
          .get("localhost:3000/api/surnames?frequency=high")
          .end(function (err, res) {
            async.each(res.body.surnames, (name) =>
              expect(name.frequency).to.be.greaterThan(0.99),
            );
            done();
          });
      });

      it("returns an error when sent gibberish", function (done) {
        request
          .get("localhost:3000/api/surnames?frequency=38be")
          .end(function (err, res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(6);
            expect(res.body.errors[0].message).to.equal(
              "Invalid frequency specified",
            );
            done();
          });
      });
    });

    describe("the racial query", function () {
      it("returns results when sent any", function (done) {
        request
          .get("localhost:3000/api/surnames?race=any&race=50")
          .end(function (err, res) {
            expect(res.body.surnames).to.have.length(10);
            done();
          });
      });

      it("returns names with pctblack above 50 when sent pctblack, 50", function (done) {
        request
          .get("localhost:3000/api/surnames?race=pctblack&race=50")
          .end(function (err, res) {
            async.each(res.body.surnames, (name) =>
              expect(name.pctblack).to.be.greaterThan(50),
            );
            done();
          });
      });

      it("returns names with pctasian above 20 when sent pctasian, 20", function (done) {
        request
          .get("localhost:3000/api/surnames?race=pctasian&race=20")
          .end(function (err, res) {
            async.each(res.body.surnames, (name) =>
              expect(name.pctasian).to.be.greaterThan(20),
            );
            done();
          });
      });

      it("returns names with pctaian above 60 when sent pctaian, 60", function (done) {
        request
          .get("localhost:3000/api/surnames?race=pctaian&race=60")
          .end(function (err, res) {
            async.each(res.body.surnames, (name) =>
              expect(name.pctaian).to.be.greaterThan(60),
            );
            done();
          });
      });

      it("returns names with pctwhite above 90 when sent pctwhite, 90", function (done) {
        request
          .get("localhost:3000/api/surnames?race=pctwhite&race=90")
          .end(function (err, res) {
            async.each(res.body.surnames, (name) =>
              expect(name.pctwhite).to.be.greaterThan(90),
            );
            done();
          });
      });

      it("returns names with pcthispanic above 95 when sent pcthispanic, 95", function (done) {
        request
          .get("localhost:3000/api/surnames?race=pcthispanic&race=95")
          .end(function (err, res) {
            async.each(res.body.surnames, (name) =>
              expect(name.pcthispanic).to.be.greaterThan(95),
            );
            done();
          });
      });

      it("returns an error when sent a non-existent race", function (done) {
        request
          .get("localhost:3000/api/surnames?race=pctdog&race=95")
          .end(function (err, res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(4);
            expect(res.body.errors[0].message).to.equal(
              "Invalid race specified",
            );
            done();
          });
      });

      it("returns an error when sent a wrong race number", function (done) {
        request
          .get("localhost:3000/api/surnames?race=pctwhite&race=dog")
          .end(function (err, res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(5);
            expect(res.body.errors[0].message).to.equal(
              "Invalid race percent specified",
            );
            done();
          });
      });

      it("returns an error when sent a race percent over 99", function (done) {
        request
          .get("localhost:3000/api/surnames?race=pctwhite&race=102")
          .end(function (err, res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(5);
            expect(res.body.errors[0].message).to.equal(
              "Invalid race percent specified",
            );
            done();
          });
      });
    });

    describe("the starts with query", function () {
      it("returns names starting with j if sent sstartswith=j", function (done) {
        request
          .get("localhost:3000/api/surnames?sstartswith=j")
          .end(function (err, res) {
            expect(res.body.surnames).to.not.be.empty();
            async.each(res.body.surnames, (name) =>
              expect(name.name.charAt(0)).to.eql("J"),
            );
            done();
          });
      });

      it("returns names starting with ka if sent sstartswith=ka", function (done) {
        request
          .get("localhost:3000/api/surnames?sstartswith=ka")
          .end(function (err, res) {
            expect(res.body.surnames).to.not.be.empty();
            async.each(res.body.surnames, function (name) {
              expect(name.name.charAt(0)).to.eql("K");
              expect(name.name.charAt(1)).to.eql("a");
            });
            done();
          });
      });

      it("returns an error when sent non-letters", function (done) {
        request
          .get("localhost:3000/api/surnames?sstartswith=D7*,;3a")
          .end(function (err, res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(7);
            expect(res.body.errors[0].message).to.equal(
              "Invalid startswith specified",
            );
            done();
          });
      });

      describe("starts with special features", function () {
        it("returns names NOT starting with C when sent sstartswith=c*", function (done) {
          request
            .get("localhost:3000/api/surnames?sstartswith=c*&limit=50")
            .end(function (err, res) {
              expect(res.body.surnames).to.not.be.empty();
              async.each(res.body.surnames, (name) =>
                expect(name.name.charAt(0)).to.not.eql("C"),
              );
              done();
            });
        });

        it("returns names NOT starting with P and S when sent sstartswith=p*,s*", function (done) {
          request
            .get("localhost:3000/api/surnames?sstartswith=p*,s*&limit=50")
            .end(function (err, res) {
              expect(res.body.surnames).to.not.be.empty();
              async.each(res.body.surnames, function (name) {
                expect(name.name.charAt(0)).to.not.eql("P");
                expect(name.name.charAt(0)).to.not.eql("S");
              });
              done();
            });
        });

        it("returns Ganz if set sstartswith=ganz^", function (done) {
          request
            .get("localhost:3000/api/surnames?sstartswith=ganz^")
            .end(function (err, res) {
              expect(res.body.surnames).to.not.be.empty();
              async.each(res.body.surnames, (name) =>
                expect(name.name).to.eql("Ganz"),
              );
              done();
            });
        });
      });
    });
  });

  describe("firstnames", function () {
    it("responds to /api/firstnames", function (done) {
      request.get("localhost:3000/api/firstnames").end(function (err, res) {
        expect(res).to.exist;
        expect(res.status).to.equal(200);
        done();
      });
    });

    it("returns a JSON array of 10 names by default", function (done) {
      request.get("localhost:3000/api/firstnames").end(function (err, res) {
        expect(res.body).to.exist;
        expect(res.body).to.not.be.empty();
        expect(res.body).to.have.key("firstnames");
        expect(res.body.firstnames).to.be.an(Array);
        expect(res.body.firstnames).to.have.length(10);
        done();
      });
    });

    describe("the year query", function () {
      it("returns names from 1985 if set year=1985", function (done) {
        request
          .get("localhost:3000/api/firstnames?year=1985")
          .end(function (err, res) {
            async.each(res.body.firstnames, (name) =>
              expect(name.year).to.eql(1985),
            );
            done();
          });
      });

      it("returns an error if year is gibberish", function (done) {
        request
          .get("localhost:3000/api/firstnames?year=boogie")
          .end(function (err, res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(1);
            expect(res.body.errors[0].message).to.equal(
              "Invalid year specified",
            );
            done();
          });
      });
    });

    describe("the limit query", function () {
      it("changes the number of results", function (done) {
        request
          .get("localhost:3000/api/firstnames?limit=33")
          .end(function (err, res) {
            expect(res.body).to.exist;
            expect(res.body.firstnames).to.have.length(33);
            done();
          });
      });

      it("returns an error if the limit is under 0", function (done) {
        request
          .get("localhost:3000/api/firstnames?limit=-5")
          .end(function (err, res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(0);
            expect(res.body.errors[0].message).to.equal(
              "Invalid limit specified",
            );
            done();
          });
      });
    });

    describe("the gender query", function () {
      it("returns a mix of male and female names when left blank", function (done) {
        request
          .get("localhost:3000/api/firstnames?limit=20")
          .end(function (err, res) {
            let genders = [];
            _(res.body.firstnames).forEach((name) => genders.push(name.gender));
            genders = _.uniq(genders);
            expect(genders).to.contain("M");
            expect(genders).to.contain("F");
            done();
          });
      });

      it("returns a mix of male and female names when sent any", function (done) {
        request
          .get("localhost:3000/api/firstnames?limit=20&gender=any")
          .end(function (err, res) {
            let genders = [];
            _(res.body.firstnames).forEach((name) => genders.push(name.gender));
            genders = _.uniq(genders);
            expect(genders).to.contain("M");
            expect(genders).to.contain("F");
            done();
          });
      });

      it("returns only male names when sent gender=male", function (done) {
        request
          .get("localhost:3000/api/firstnames?gender=male")
          .end(function (err, res) {
            async.each(res.body.firstnames, (name) =>
              expect(name.gender).to.eql("M"),
            );
            done();
          });
      });

      it("returns only female names when sent gender=female", function (done) {
        request
          .get("localhost:3000/api/firstnames?gender=female")
          .end(function (err, res) {
            async.each(res.body.firstnames, (name) =>
              expect(name.gender).to.eql("F"),
            );
            done();
          });
      });

      it("returns an error when gender is set to gibberish", function (done) {
        request
          .get("localhost:3000/api/firstnames?gender=doggy")
          .end(function (err, res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(2);
            expect(res.body.errors[0].message).to.equal(
              "Invalid gender specified",
            );
            done();
          });
      });
    });

    describe("the rank query", function () {
      it("returns results when sent any", function (done) {
        request
          .get("localhost:3000/api/firstnames?rank=any&gender=male&year=1880")
          .end(function (err, res) {
            expect(res.body.firstnames).to.have.length(10);
            done();
          });
      });

      describe("max(rank) less than 500", function () {
        it("high returns names from the top 125", function (done) {
          request
            .get(
              "localhost:3000/api/firstnames?rank=high&gender=male&year=1880",
            )
            .end(function (err, res) {
              async.each(res.body.firstnames, (name) =>
                expect(name.rank).to.be.lessThan(126),
              );
              done();
            });
        });

        it("low returns names ranked greater than 125", function (done) {
          request
            .get("localhost:3000/api/firstnames?rank=low&gender=male&year=1902")
            .end(function (err, res) {
              async.each(res.body.firstnames, (name) =>
                expect(name.rank).to.be.greaterThan(125),
              );
              done();
            });
        });

        it("returns an error when sent gibberish", function (done) {
          request
            .get(
              "localhost:3000/api/firstnames?rank=dkd8&gender=female&year=1900",
            )
            .end(function (err, res) {
              expect(res.status).to.equal(400);
              expect(res.body).to.have.key("errors");
              expect(res.body.errors).to.be.an(Array);
              expect(res.body.errors[0].code).to.equal(3);
              expect(res.body.errors[0].message).to.equal(
                "Invalid rank specified",
              );
              done();
            });
        });
      });

      describe("max(rank) greater than 500", function () {
        it("high returns names from the top 300", function (done) {
          request
            .get(
              "localhost:3000/api/firstnames?rank=high&gender=female&year=1980",
            )
            .end(function (err, res) {
              async.each(res.body.firstnames, (name) =>
                expect(name.rank).to.be.lessThan(301),
              );
              done();
            });
        });

        it("low returns names ranked greater than 300", function (done) {
          request
            .get(
              "localhost:3000/api/firstnames?rank=low&gender=female&year=2002",
            )
            .end(function (err, res) {
              async.each(res.body.firstnames, (name) =>
                expect(name.rank).to.be.greaterThan(300),
              );
              done();
            });
        });

        it("returns an error when sent gibberish", function (done) {
          request
            .get(
              "localhost:3000/api/firstnames?rank=dkd8&gender=female&year=2002",
            )
            .end(function (err, res) {
              expect(res.status).to.equal(400);
              expect(res.body).to.have.key("errors");
              expect(res.body.errors).to.be.an(Array);
              expect(res.body.errors[0].code).to.equal(3);
              expect(res.body.errors[0].message).to.equal(
                "Invalid rank specified",
              );
              done();
            });
        });
      });

      describe("when in year zero", function () {
        it("high returns names from the top 800", function (done) {
          request
            .get("localhost:3000/api/firstnames?rank=high&gender=female&year=0")
            .end(function (err, res) {
              async.each(res.body.firstnames, (name) =>
                expect(name.rank).to.be.lessThan(801),
              );
              done();
            });
        });

        it("low returns names ranked greater than 800", function (done) {
          request
            .get(
              "localhost:3000/api/firstnames?rank=low&gender=female&year=0&limit=100",
            )
            .end(function (err, res) {
              async.each(res.body.firstnames, (name) =>
                expect(name.rank).to.be.greaterThan(800),
              );
              done();
            });
        });
      });
    });

    describe("the starts with query", function () {
      it("returns names starting with s if set fstartswith=s", function (done) {
        request
          .get("localhost:3000/api/firstnames?fstartswith=s")
          .end(function (err, res) {
            expect(res.body.firstnames).to.not.be.empty();
            async.each(res.body.firstnames, (name) =>
              expect(name.name.charAt(0)).to.eql("S"),
            );
            done();
          });
      });

      it("returns names starting with da if set fstartswith=da", function (done) {
        request
          .get("localhost:3000/api/firstnames?fstartswith=da")
          .end(function (err, res) {
            expect(res.body.firstnames).to.not.be.empty();
            async.each(res.body.firstnames, function (name) {
              expect(name.name.charAt(0)).to.eql("D");
              expect(name.name.charAt(1)).to.eql("a");
            });
            done();
          });
      });

      it("returns Jason if set fstartswith=jason^", function (done) {
        request
          .get("localhost:3000/api/firstnames?fstartswith=jason^&gender=male")
          .end(function (err, res) {
            expect(res.body.firstnames).to.not.be.empty();
            async.each(res.body.firstnames, (name) =>
              expect(name.name).to.eql("Jason"),
            );
            done();
          });
      });

      it("returns an error when sent non-letters", function (done) {
        request
          .get("localhost:3000/api/firstnames?fstartswith=D4a")
          .end(function (err, res) {
            expect(res.status).to.equal(400);
            expect(res.body).to.have.key("errors");
            expect(res.body.errors).to.be.an(Array);
            expect(res.body.errors[0].code).to.equal(7);
            expect(res.body.errors[0].message).to.equal(
              "Invalid startswith specified",
            );
            done();
          });
      });

      describe("starts with special features", function () {
        it("returns names NOT starting with C when sent fstartswith=c*", function (done) {
          request
            .get("localhost:3000/api/firstnames?fstartswith=c*&limit=50")
            .end(function (err, res) {
              expect(res.body.firstnames).to.not.be.empty();
              async.each(res.body.firstnames, (name) =>
                expect(name.name.charAt(0)).to.not.eql("C"),
              );
              done();
            });
        });

        it("returns names NOT starting with P and S when sent fstartswith=p*,s*", function (done) {
          request
            .get("localhost:3000/api/firstnames?fstartswith=p*,s*&limit=50")
            .end(function (err, res) {
              expect(res.body.firstnames).to.not.be.empty();
              async.each(res.body.firstnames, function (name) {
                expect(name.name.charAt(0)).to.not.eql("P");
                expect(name.name.charAt(0)).to.not.eql("S");
              });
              done();
            });
        });
      });
    });
  });

  describe("names", function () {
    it("responds to /api/names", function (done) {
      request.get("localhost:3000/api/names").end(function (err, res) {
        expect(res).to.exist;
        expect(res.status).to.equal(200);
        done();
      });
    });

    it("should not have any warnings when accessed with default settings", function (done) {
      request.get("localhost:3000/api/names").end(function (err, res) {
        expect(res).to.exist;
        expect(res.body).not.to.have.key("warnings");
        done();
      });
    });

    it("provides warning if fewer than the requested number of names are available", function (done) {
      request
        .get(
          "localhost:3000/api/names?limit=100&rank=high&frequency=high&gender=female&year=1880&race=pctaian&race=50",
        )
        .end(function (err, res) {
          expect(res.body).to.have.key("warnings");
          done();
        });
    });
  });
});
