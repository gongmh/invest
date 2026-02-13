const express = require('express');
const router = express.Router();
const aiAnalysisService = require('../services/aiAnalysisService');

router.post('/analyze', async (req, res) => {
  try {
    const { stockInfo, historyData } = req.body;
    
    if (!stockInfo || !historyData) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少股票信息或历史数据' 
      });
    }
    
    const analysis = await aiAnalysisService.analyzeStock(stockInfo, historyData);
    
    res.json({ 
      success: true, 
      data: analysis 
    });
  } catch (error) {
    console.error('AI分析失败:', error);
    res.status(500).json({ 
      success: false, 
      message: 'AI分析失败，请稍后重试' 
    });
  }
});

module.exports = router;
