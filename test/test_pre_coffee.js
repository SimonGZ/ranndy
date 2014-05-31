var request = require('superagent');
var expect = require('expect.js');
var async = require('async');

describe('Server', function(){

  it("responds to basic requests", function(done){
    request.get('localhost:3000/').end(function(res){
        expect(res).to.exist;
        expect(res.status).to.equal(200);
        done();
    });
  });

});

describe('API', function(){

  describe('surnames', function(){  

    it("responds to /api/surnames", function(done){
      request.get('localhost:3000/api/surnames').end(function(res){
        expect(res).to.exist;
        expect(res.status).to.equal(200);
          done();
      });
    });

    it("returns a JSON array of 10 names by default", function(done){
      request.get('localhost:3000/api/surnames').end(function(res){
        expect(res.body).to.exist;
        expect(res.body).to.not.be.empty();
        expect(res.body).to.have.key('surnames');
        expect(res.body.surnames).to.be.an(Array);
        expect(res.body.surnames).to.have.length(10);
        done();
      });
    });

    describe('the limit query', function(){
      it("changes the number of results", function(done){
        request.get('localhost:3000/api/surnames?limit=23').end(function(res){
          expect(res.body).to.exist;
          expect(res.body.surnames).to.have.length(23);
          done();
        }); 
      });

      it("returns 10 results if the limit is over 100 or under 0", function(done){
        request.get('localhost:3000/api/surnames?limit=130').end(function(res){
          expect(res.body.surnames).to.have.length(10);
          done();
        });
      });
    });

    describe('the frequency query', function(){
      it("returns names with frequencies below 0.1 when sent low", function(done){
        request.get('localhost:3000/api/surnames?frequency=low').end(function(res){
          async.each(res.body.surnames, function(name){
            expect(name.frequency).to.be.lessThan(0.1);
          });
          done();
        });
      });
    });
    
  });

});

describe('query builder', function(){

  it("passes through valid frequency queries", function(){

  });
});
