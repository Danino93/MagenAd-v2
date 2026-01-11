/*
 * ================================================
 * Source Key Utilities
 * ================================================
 * 
 * מטרה: פונקציות עזר לעבודה עם Source Keys
 * 
 * Source Key Format:
 * ------------------
 * campaign_id|ad_group_id|ad_id|keyword
 * 
 * דוגמאות:
 * --------
 * "12345|67890|11111|running shoes"
 * "12345|67890|11111|*" (all keywords)
 * "12345|67890|*|*" (all ads in ad group)
 * "12345|*|*|*" (all in campaign)
 * 
 * ================================================
 */

/**
 * Generate Source Key from components
 * 
 * @param {string} campaignId - Campaign ID
 * @param {string} adGroupId - Ad Group ID (optional, default: '*')
 * @param {string} adId - Ad ID (optional, default: '*')
 * @param {string} keyword - Keyword (optional, default: '*')
 * @returns {string} Source key
 * 
 * @example
 * generateSourceKey('12345', '67890', '11111', 'running shoes')
 * // Returns: "12345|67890|11111|running shoes"
 * 
 * generateSourceKey('12345', '67890')
 * // Returns: "12345|67890|*|*"
 */
function generateSourceKey(campaignId, adGroupId = '*', adId = '*', keyword = '*') {
  if (!campaignId) {
    throw new Error('campaignId is required');
  }
  
  // Normalize components
  const parts = [
    campaignId.toString(),
    adGroupId ? adGroupId.toString() : '*',
    adId ? adId.toString() : '*',
    keyword ? keyword.toString().trim() : '*'
  ];
  
  return parts.join('|');
}

/**
 * Parse Source Key into components
 * 
 * @param {string} sourceKey - Source key to parse
 * @returns {Object} Parsed components
 * 
 * @example
 * parseSourceKey("12345|67890|11111|running shoes")
 * // Returns: {
 * //   campaignId: '12345',
 * //   adGroupId: '67890',
 * //   adId: '11111',
 * //   keyword: 'running shoes',
 * //   level: 'keyword'
 * // }
 */
function parseSourceKey(sourceKey) {
  if (!sourceKey || typeof sourceKey !== 'string') {
    throw new Error('Invalid source key');
  }
  
  const parts = sourceKey.split('|');
  
  if (parts.length !== 4) {
    throw new Error('Source key must have 4 parts separated by |');
  }
  
  const [campaignId, adGroupId, adId, keyword] = parts;
  
  // Determine granularity level
  let level = 'campaign';
  if (keyword !== '*') level = 'keyword';
  else if (adId !== '*') level = 'ad';
  else if (adGroupId !== '*') level = 'ad_group';
  
  return {
    campaignId,
    adGroupId: adGroupId === '*' ? null : adGroupId,
    adId: adId === '*' ? null : adId,
    keyword: keyword === '*' ? null : keyword,
    level
  };
}

/**
 * Get parent Source Key (go up one level)
 * 
 * @param {string} sourceKey - Source key
 * @returns {string|null} Parent source key, or null if already at campaign level
 * 
 * @example
 * getParentSourceKey("12345|67890|11111|running shoes")
 * // Returns: "12345|67890|11111|*"
 * 
 * getParentSourceKey("12345|*|*|*")
 * // Returns: null (already at campaign level)
 */
function getParentSourceKey(sourceKey) {
  const parsed = parseSourceKey(sourceKey);
  
  if (parsed.level === 'campaign') {
    return null; // Already at top level
  }
  
  if (parsed.level === 'keyword') {
    return generateSourceKey(parsed.campaignId, parsed.adGroupId, parsed.adId, '*');
  }
  
  if (parsed.level === 'ad') {
    return generateSourceKey(parsed.campaignId, parsed.adGroupId, '*', '*');
  }
  
  if (parsed.level === 'ad_group') {
    return generateSourceKey(parsed.campaignId, '*', '*', '*');
  }
}

/**
 * Group events by Source Key
 * 
 * @param {Array} events - Array of events with source_key property
 * @returns {Object} Events grouped by source key
 * 
 * @example
 * const events = [
 *   { source_key: "12345|67890|11111|shoes", clicks: 10 },
 *   { source_key: "12345|67890|11111|shoes", clicks: 5 },
 *   { source_key: "12345|67890|22222|boots", clicks: 8 }
 * ]
 * 
 * groupBySourceKey(events)
 * // Returns: {
 * //   "12345|67890|11111|shoes": [event1, event2],
 * //   "12345|67890|22222|boots": [event3]
 * // }
 */
function groupBySourceKey(events) {
  if (!Array.isArray(events)) {
    throw new Error('Events must be an array');
  }
  
  return events.reduce((groups, event) => {
    const key = event.source_key;
    
    if (!key) {
      console.warn('Event without source_key:', event);
      return groups;
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    
    groups[key].push(event);
    return groups;
  }, {});
}

/**
 * Aggregate metrics by Source Key
 * 
 * @param {Array} events - Array of events
 * @param {string} level - Aggregation level ('campaign', 'ad_group', 'ad', 'keyword')
 * @returns {Object} Aggregated metrics by source key
 * 
 * @example
 * aggregateBySourceKey(events, 'ad_group')
 * // Returns: {
 * //   "12345|67890|*|*": { clicks: 23, cost: 45.67, conversions: 2 },
 * //   "12345|78901|*|*": { clicks: 15, cost: 30.12, conversions: 1 }
 * // }
 */
function aggregateBySourceKey(events, level = 'keyword') {
  const grouped = {};
  
  for (const event of events) {
    const parsed = parseSourceKey(event.source_key);
    
    // Generate key at requested level
    let aggregateKey;
    switch (level) {
      case 'campaign':
        aggregateKey = generateSourceKey(parsed.campaignId);
        break;
      case 'ad_group':
        aggregateKey = generateSourceKey(parsed.campaignId, parsed.adGroupId);
        break;
      case 'ad':
        aggregateKey = generateSourceKey(parsed.campaignId, parsed.adGroupId, parsed.adId);
        break;
      case 'keyword':
      default:
        aggregateKey = event.source_key;
    }
    
    // Initialize if needed
    if (!grouped[aggregateKey]) {
      grouped[aggregateKey] = {
        source_key: aggregateKey,
        clicks: 0,
        impressions: 0,
        cost: 0,
        conversions: 0,
        events: []
      };
    }
    
    // Aggregate
    grouped[aggregateKey].clicks += event.clicks || 0;
    grouped[aggregateKey].impressions += event.impressions || 0;
    grouped[aggregateKey].cost += (event.cost || event.cost_micros / 1000000 || 0);
    grouped[aggregateKey].conversions += event.conversions || 0;
    grouped[aggregateKey].events.push(event);
  }
  
  return grouped;
}

/**
 * Check if Source Key matches pattern
 * 
 * @param {string} sourceKey - Source key to check
 * @param {string} pattern - Pattern to match against
 * @returns {boolean} True if matches
 * 
 * @example
 * matchesPattern("12345|67890|11111|shoes", "12345|*|*|*")
 * // Returns: true
 * 
 * matchesPattern("12345|67890|11111|shoes", "12345|67890|*|*")
 * // Returns: true
 * 
 * matchesPattern("12345|67890|11111|shoes", "99999|*|*|*")
 * // Returns: false
 */
function matchesPattern(sourceKey, pattern) {
  const keyParts = sourceKey.split('|');
  const patternParts = pattern.split('|');
  
  if (keyParts.length !== 4 || patternParts.length !== 4) {
    return false;
  }
  
  for (let i = 0; i < 4; i++) {
    if (patternParts[i] !== '*' && keyParts[i] !== patternParts[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get Source Key level depth
 * 
 * @param {string} sourceKey - Source key
 * @returns {number} Depth (0=campaign, 1=ad_group, 2=ad, 3=keyword)
 * 
 * @example
 * getSourceKeyDepth("12345|*|*|*") // Returns: 0
 * getSourceKeyDepth("12345|67890|*|*") // Returns: 1
 * getSourceKeyDepth("12345|67890|11111|shoes") // Returns: 3
 */
function getSourceKeyDepth(sourceKey) {
  const parsed = parseSourceKey(sourceKey);
  
  const levels = {
    'campaign': 0,
    'ad_group': 1,
    'ad': 2,
    'keyword': 3
  };
  
  return levels[parsed.level] || 0;
}

/**
 * Format Source Key for display
 * 
 * @param {string} sourceKey - Source key
 * @param {boolean} includeLevel - Include level indicator
 * @returns {string} Formatted string
 * 
 * @example
 * formatSourceKey("12345|67890|11111|running shoes", true)
 * // Returns: "[Keyword] 12345 > 67890 > 11111 > running shoes"
 */
function formatSourceKey(sourceKey, includeLevel = false) {
  const parsed = parseSourceKey(sourceKey);
  
  const parts = [];
  
  if (includeLevel) {
    const levelNames = {
      'campaign': 'Campaign',
      'ad_group': 'Ad Group',
      'ad': 'Ad',
      'keyword': 'Keyword'
    };
    parts.push(`[${levelNames[parsed.level]}]`);
  }
  
  parts.push(parsed.campaignId);
  
  if (parsed.adGroupId) {
    parts.push(parsed.adGroupId);
  }
  
  if (parsed.adId) {
    parts.push(parsed.adId);
  }
  
  if (parsed.keyword) {
    parts.push(parsed.keyword);
  }
  
  return parts.join(' > ');
}

// Export all functions
module.exports = {
  generateSourceKey,
  parseSourceKey,
  getParentSourceKey,
  groupBySourceKey,
  aggregateBySourceKey,
  matchesPattern,
  getSourceKeyDepth,
  formatSourceKey
};
