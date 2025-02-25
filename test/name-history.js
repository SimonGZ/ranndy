const request = require("superagent");
const expect = require("expect.js");
const async = require("async");
const _ = require("lodash");

describe("name popularity history", function () {
  const endpoint = "/api/firstnames/history";

  it("responds to /api/firstnames/history", function (done) {
    request
      .get("localhost:" + process.env.PORT + endpoint)
      .query({ name: "James" })
      .end(function (err, res) {
        expect(res).to.exist;
        expect(res.status).to.equal(200);
        done();
      });
  });

  it("returns error if no name parameter provided", function (done) {
    request
      .get("localhost:" + process.env.PORT + endpoint)
      .end(function (err, res) {
        expect(res.status).to.equal(400);
        expect(res.body).to.have.key("errors");
        expect(res.body.errors[0].message).to.equal(
          "Name parameter is required",
        );
        done();
      });
  });

  describe("successful responses", function () {
    it("returns historical data for a given name", function (done) {
      request
        .get("localhost:" + process.env.PORT + endpoint)
        .query({ name: "Michael" })
        .end(function (err, res) {
          expect(res.body).to.have.key("history");
          expect(res.body.history).to.be.an(Array);
          expect(res.body.history[0]).to.have.keys([
            "year",
            "rank",
            "count",
            "gender",
          ]);
          done();
        });
    });

    it("returns data sorted by year in ascending order", function (done) {
      request
        .get("localhost:" + process.env.PORT + endpoint)
        .query({ name: "Jennifer" })
        .end(function (err, res) {
          expect(res.body.history).to.be.an(Array);
          const years = res.body.history.map((entry) => entry.year);
          const sortedYears = [...years].sort((a, b) => a - b);
          expect(years).to.eql(sortedYears);
          done();
        });
    });

    it("handles case-insensitive name matching", function (done) {
      request
        .get("localhost:" + process.env.PORT + endpoint)
        .query({ name: "mary" })
        .end(function (err, res) {
          expect(res.status).to.equal(200);
          expect(res.body.history).to.not.be.empty();
          expect(res.body.history[0].name).to.equal("Mary");
          done();
        });
    });
  });

  describe("filtering options", function () {
    it("can filter by gender", function (done) {
      request
        .get("localhost:" + process.env.PORT + endpoint)
        .query({ name: "Pat", gender: "male" })
        .end(function (err, res) {
          expect(res.body.history).to.be.an(Array);
          async.each(res.body.history, (entry) =>
            expect(entry.gender).to.equal("M"),
          );
          done();
        });
    });
  });

  describe("error handling", function () {
    it("returns 404 for names that don't exist", function (done) {
      request
        .get("localhost:" + process.env.PORT + endpoint)
        .query({ name: "Xyzzy123" })
        .end(function (err, res) {
          expect(res.status).to.equal(404);
          expect(res.body).to.have.key("errors");
          expect(res.body.errors[0].message).to.equal("Name not found");
          done();
        });
    });

    it("returns error for invalid gender parameter", function (done) {
      request
        .get("localhost:" + process.env.PORT + endpoint)
        .query({ name: "Sam", gender: "X" })
        .end(function (err, res) {
          expect(res.status).to.equal(400);
          expect(res.body).to.have.key("errors");
          expect(res.body.errors[0].message).to.equal(
            "Invalid gender specified",
          );
          done();
        });
    });
  });
});
