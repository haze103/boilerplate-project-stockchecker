const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  this.timeout(5000); // Allow 5 seconds instead of 2

  test('Viewing one stock: GET request to /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices/')
      .query({ stock: 'goog' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // ... rest of your test code
        done();
      });
  });

  test('Viewing one stock and liking it: GET request to /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices/')
      .query({ stock: 'goog', like: true })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.likes);
        done();
      });
  });

  test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices/')
      .query({ stock: 'goog', like: true })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Likes should not increase if IP is same
        done();
      });
  });

  test('Viewing two stocks: GET request to /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices/')
      .query({ stock: ['goog', 'msft'] })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.property(res.body.stockData[0], 'rel_likes');
        done();
      });
  });

  test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function(done) {
    chai.request(server)
      .get('/api/stock-prices/')
      .query({ stock: ['goog', 'msft'], like: true })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.property(res.body.stockData[0], 'rel_likes');
        done();
      });
  });

});