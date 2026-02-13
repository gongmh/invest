const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/kline', async (req, res) => {
  try {
    const { symbol, days = 30 } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少股票代码' 
      });
    }
    
    const response = await axios.get('https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getKLineData', {
      params: {
        symbol: symbol,
        scale: 240,
        datalen: parseInt(days) || 30
      }
    });
    
    res.json({ 
      success: true, 
      data: response.data 
    });
  } catch (error) {
    console.error('获取K线数据失败:', error.message);
    res.status(500).json({ 
      success: false, 
      message: '获取K线数据失败' 
    });
  }
});

module.exports = router;
