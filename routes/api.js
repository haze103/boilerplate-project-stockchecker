'use strict';
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');

// 1. Define the Database Schema
const StockSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  likes: { type: [String], default: [] } // Array of hashed IPs
});
const Stock = mongoose.model('Stock', StockSchema);

module.exports = function (app) {

  // 2. Helper function to get stock price
  async function getStockPrice(stockSymbol) {
    try {
      const response = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`);
      return response.data.latestPrice;
    } catch (error) {
      console.error('Error fetching stock:', error);
      return null;
    }
  }

  // 3. Helper function to handle DB likes
  async function findUpdateStock(stockSymbol, like, ip) {
    let stockDocument = await Stock.findOne({ symbol: stockSymbol });
    
    if (!stockDocument) {
      stockDocument = new Stock({ symbol: stockSymbol });
    }

    if (like && ip) {
      // Hash the IP for privacy       const hashedIP = crypto.createHash('sha256').update(ip).digest('hex');
      
      // Add IP if not already liked
      if (!stockDocument.likes.includes(hashedIP)) {
        stockDocument.likes.push(hashedIP);
      }
    }
    
    await stockDocument.save();
    return stockDocument.likes.length;
  }

  // 4. Main API Route
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const { stock, like } = req.query;
      const isLike = like === 'true';
      const ip = req.ip; // Express gets the IP automatically

      // CASE A: Two Stocks (Comparison)
      if (Array.isArray(stock)) {
        const symbol1 = stock[0].toUpperCase();
        const symbol2 = stock[1].toUpperCase();

        const price1 = await getStockPrice(symbol1);
        const price2 = await getStockPrice(symbol2);

        const likes1 = await findUpdateStock(symbol1, isLike, ip);
        const likes2 = await findUpdateStock(symbol2, isLike, ip);

        res.json({
          stockData: [
            { stock: symbol1, price: price1, rel_likes: likes1 - likes2 },
            { stock: symbol2, price: price2, rel_likes: likes2 - likes1 }
          ]
        });

      // CASE B: One Stock
      } else {
        const symbol = stock.toUpperCase();
        const price = await getStockPrice(symbol);
        const likes = await findUpdateStock(symbol, isLike, ip);

        res.json({
          stockData: { stock: symbol, price: price, likes: likes }
        });
      }
    });
};