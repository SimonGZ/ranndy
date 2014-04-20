var request = require('superagent');
var expect = require('expect.js');

describe('Server', function(){

	it("responds to basic requests", function(done) {
		request.get('localhost:3000/').end(function(res){
		    expect(res).to.exist;
		    expect(res.status).to.equal(200);
		    done();
		});
	});

});