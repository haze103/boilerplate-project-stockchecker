'use strict';
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Define Schema
const StockSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  likes: { type: [String], default: [] }
});
const Stock = mongoose.model('Stock', StockSchema);

module.exports = function (app) {

  // Helper: Get Price
  async function getStockPrice(stockSymbol) {
    try {
      const response = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`);
      return response.data.latestPrice;
    } catch (error) {
      console.error('API Error:', error.message);
      return null;
    }
  }

  // Helper: Handle DB Likes
  async function findUpdateStock(stockSymbol, like, ip) {
    let stockDocument = await Stock.findOne({ symbol: stockSymbol });
    if (!stockDocument) {
      stockDocument = new Stock({ symbol: stockSymbol });
    }

    if (like && ip) {
      const hashedIP = crypto.createHash('sha256').update(ip).digest('hex');
      // Only push if not already liked
      if (!stockDocument.likes.includes(hashedIP)) {
        stockDocument.likes.push(hashedIP);
      }
    }
    await stockDocument.save();
    return stockDocument.likes.length;
  }

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try { // <--- TRY/CATCH BLOCK ADDED
        const { stock, like } = req.query;
        const isLike = like === 'true';
        const ip = req.ip || '127.0.0.1'; // Fallback IP if localhost

        // CASE A: Two Stocks
        if (Array.isArray(stock)) {
          const symbol1 = stock[0].toUpperCase();
          const symbol2 = stock[1].toUpperCase();

          const price1 = await getStockPrice(symbol1);
          const price2 = await getStockPrice(symbol2);

          const likes1 = await findUpdateStock(symbol1, isLike, ip);
          const likes2 = await findUpdateStock(symbol2, isLike, ip);

          return res.json({
            stockData: [
              { stock: symbol1, price: price1, rel_likes: likes1 - likes2 },
              { stock: symbol2, price: price2, rel_likes: likes2 - likes1 }
            ]
          });
        }
        
        // CASE B: One Stock
        const symbol = stock.toUpperCase();
        const price = await getStockPrice(symbol);
        const likes = await findUpdateStock(symbol, isLike, ip);

        return res.json({
          stockData: { stock: symbol, price: price, likes: likes }
        });

      } catch (err) {
        console.error("Server Error:", err); // Log the specific error
        res.status(500).send("Internal Server Error"); // Stop the timeout
      }
    });
};