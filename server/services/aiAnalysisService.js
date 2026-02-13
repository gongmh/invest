/**
 * AI股票分析服务
 * 
 * 本服务提供股票技术分析功能，支持两种分析模式：
 * 
 * 1. DeepSeek AI 分析模式（优先）
 *    - 当环境变量 DEEPSEEK_API_KEY 配置时启用
 *    - 使用 DeepSeek Chat 大语言模型进行智能分析
 *    - API文档: https://platform.deepseek.com/api-docs/
 *    - 模型: deepseek-chat
 * 
 * 2. 本地算法分析模式（降级）
 *    - 当 DeepSeek API 不可用时自动降级使用
 *    - 基于技术指标（MA均线、RSI）的本地计算
 *    - 提供基础的买入/卖出/持有信号判断
 */
const axios = require('axios');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

/**
 * 分析股票数据
 * @param {Object} stockInfo - 股票基本信息
 * @param {Array} historyData - 历史价格数据
 * @returns {Object} 分析结果，包含信号、置信度、建议和技术指标
 */
const analyzeStock = async (stockInfo, historyData) => {
  if (!DEEPSEEK_API_KEY) {
    return getLocalAnalysis(stockInfo, historyData);
  }

  const prompt = buildAnalysisPrompt(stockInfo, historyData);

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是股票分析师，根据数据给出简练客观的分析结论。

要求：
1. 综合信号：只能是"买入"、"卖出"或"持有"
2. 置信度：0-100的整数
3. 分析建议：50字以内，简明扼要说明理由
4. 技术指标：MA5、MA10、MA20、RSI的数值

返回JSON格式：
{
  "signal": "买入/卖出/持有",
  "confidence": 75,
  "suggestion": "简练分析...",
  "indicators": {
    "ma5": "数值",
    "ma10": "数值", 
    "ma20": "数值",
    "rsi": "数值"
  }
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        signal: result.signal || '持有',
        confidence: Math.min(100, Math.max(0, result.confidence || 50)),
        suggestion: result.suggestion || '暂无分析建议',
        model: 'DeepSeek AI',
        indicators: {
          ma5: result.indicators?.ma5 || calculateMA(historyData, 5).toFixed(2),
          ma10: result.indicators?.ma10 || calculateMA(historyData, 10).toFixed(2),
          ma20: result.indicators?.ma20 || calculateMA(historyData, 20).toFixed(2),
          rsi: result.indicators?.rsi || calculateRSI(historyData).toFixed(2)
        }
      };
    }
    
    return getLocalAnalysis(stockInfo, historyData);
  } catch (error) {
    console.error('DeepSeek API调用失败:', error.message);
    return getLocalAnalysis(stockInfo, historyData);
  }
};

/**
 * 构建分析提示词
 * 将股票信息和历史数据格式化为 DeepSeek AI 可理解的提示词
 * @param {Object} stockInfo - 股票基本信息
 * @param {Array} historyData - 历史价格数据
 * @returns {string} 格式化后的提示词
 */
const buildAnalysisPrompt = (stockInfo, historyData) => {
  const recentPrices = historyData.slice(-10).map(d => ({
    date: d.date,
    close: d.close,
    volume: d.volume
  }));

  return `请分析以下股票数据：

股票信息：
- 名称：${stockInfo.name}
- 代码：${stockInfo.code}
- 当前价格：${stockInfo.price}元
- 涨跌幅：${stockInfo.changePercent}%
- 今开：${stockInfo.open}元
- 昨收：${stockInfo.close}元
- 最高：${stockInfo.high}元
- 最低：${stockInfo.low}元
- 成交量：${(stockInfo.volume / 10000).toFixed(0)}万手
- 成交额：${(stockInfo.amount / 100000000).toFixed(2)}亿
- 市盈率：${stockInfo.pe}
- 市净率：${stockInfo.pb}

近10日价格走势：
${recentPrices.map(p => `${p.date}: 收盘${p.close}元, 成交量${(p.volume/10000).toFixed(0)}万手`).join('\n')}

请给出专业的分析结论。`;
};

/**
 * 本地算法分析（降级方案）
 * 当 DeepSeek API 不可用时，使用本地技术指标计算进行分析
 * 
 * 分析逻辑：
 * - 多头排列（MA5 > MA10 > MA20 且股价站上各均线）：买入信号
 * - 空头排列（股价跌破所有均线）：卖出信号
 * - 其他情况：持有信号
 * - RSI指标辅助判断超买/超卖区域
 * 
 * @param {Object} stockInfo - 股票基本信息
 * @param {Array} historyData - 历史价格数据
 * @returns {Object} 分析结果
 */
const getLocalAnalysis = (stockInfo, historyData) => {
  const prices = historyData.map(h => parseFloat(h.close));
  const ma5 = calculateMA(historyData, 5);
  const ma10 = calculateMA(historyData, 10);
  const ma20 = calculateMA(historyData, 20);
  const rsi = calculateRSI(historyData);
  
  const currentPrice = stockInfo.price;
  let signal = '持有';
  let confidence = 50;
  let suggestion = '';

  const ma5Above = currentPrice > ma5;
  const ma10Above = currentPrice > ma10;
  const ma20Above = currentPrice > ma20;
  const maTrend = ma5 > ma10 && ma10 > ma20;

  if (ma5Above && ma10Above && ma20Above && maTrend) {
    signal = '买入';
    confidence = 70;
    suggestion = `多头排列，股价站上各均线，短期趋势向好。RSI=${rsi.toFixed(0)}${rsi < 30 ? '超卖' : rsi > 70 ? '超买注意风险' : ''}，建议适量建仓。`;
  } else if (!ma5Above && !ma10Above && !ma20Above) {
    signal = '卖出';
    confidence = 65;
    suggestion = `空头排列，股价跌破各均线，短期趋势偏弱。RSI=${rsi.toFixed(0)}${rsi < 30 ? '超卖' : rsi > 70 ? '超买' : ''}，建议减仓观望。`;
  } else {
    signal = '持有';
    confidence = 55;
    suggestion = `震荡走势，股价在均线间徘徊。RSI=${rsi.toFixed(0)}，建议观望等待明确信号。`;
  }

  return {
    signal,
    confidence,
    suggestion,
    model: '本地算法',
    indicators: {
      ma5: ma5.toFixed(2),
      ma10: ma10.toFixed(2),
      ma20: ma20.toFixed(2),
      rsi: rsi.toFixed(2)
    }
  };
};

/**
 * 计算移动平均线（MA）
 * @param {Array} data - 历史价格数据
 * @param {number} period - 周期天数
 * @returns {number} MA值
 */
const calculateMA = (data, period) => {
  if (data.length < period) {
    return parseFloat(data[data.length - 1]?.close || 0);
  }
  const slice = data.slice(-period);
  return slice.reduce((sum, d) => sum + parseFloat(d.close), 0) / period;
};

/**
 * 计算相对强弱指标（RSI）
 * RSI = 100 - 100 / (1 + RS)
 * RS = 平均上涨幅度 / 平均下跌幅度
 * 
 * @param {Array} data - 历史价格数据
 * @param {number} period - 周期天数，默认14天
 * @returns {number} RSI值（0-100）
 */
const calculateRSI = (data, period = 14) => {
  if (data.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = data.length - period; i < data.length; i++) {
    const change = parseFloat(data[i].close) - parseFloat(data[i - 1].close);
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

module.exports = {
  analyzeStock
};
