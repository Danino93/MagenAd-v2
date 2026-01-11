/*
 * Query Optimizer Service
 * -----------------------
 * אופטימיזציה של שאילתות
 */

class QueryOptimizer {
  
  /**
   * Get paginated detections with optimized query
   */
  static async getPaginatedDetections(supabase, userId, page = 1, limit = 20, filters = {}) {
    let query = supabase
      .from('anomalies')
      .select(`
        id,
        rule_name,
        severity_level,
        confidence,
        description,
        detected_at,
        status
      `, { count: 'exact' })
      .eq('user_id', userId)
    
    // Apply filters
    if (filters.severity) {
      query = query.eq('severity_level', filters.severity)
    }
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }
    
    if (filters.dateFrom) {
      query = query.gte('detected_at', filters.dateFrom)
    }
    
    if (filters.dateTo) {
      query = query.lte('detected_at', filters.dateTo)
    }
    
    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query
      .order('detected_at', { ascending: false })
      .range(from, to)
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    }
  }
  
  /**
   * Get dashboard stats with single query
   */
  static async getDashboardStats(supabase, userId) {
    // Use aggregation instead of multiple queries
    try {
      // Try to use database function if exists
      const { data, error } = await supabase
        .rpc('get_dashboard_stats', { p_user_id: userId })
      
      if (!error && data) {
        return data
      }
    } catch (err) {
      // Fallback to individual queries if function doesn't exist
      console.log('[QueryOptimizer] Using fallback queries')
    }
    
    // Fallback: individual queries
    const [campaigns, anomalies, highSeverity, resolved, clicks, cost] = await Promise.all([
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true),
      supabase.from('anomalies').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('anomalies').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('severity_level', 'high'),
      supabase.from('anomalies').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'resolved'),
      supabase.from('raw_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('raw_events').select('cost').eq('user_id', userId)
    ])
    
    const totalCost = cost.data?.reduce((sum, event) => sum + (event.cost || 0), 0) || 0
    
    return {
      total_campaigns: campaigns.count || 0,
      total_anomalies: anomalies.count || 0,
      high_severity: highSeverity.count || 0,
      resolved_anomalies: resolved.count || 0,
      total_clicks: clicks.count || 0,
      total_cost: totalCost
    }
  }
  
  /**
   * Batch insert events (more efficient than individual inserts)
   */
  static async batchInsertEvents(supabase, events) {
    const BATCH_SIZE = 1000
    const results = []
    
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE)
      
      const { data, error } = await supabase
        .from('raw_events')
        .insert(batch)
      
      if (error) throw error
      
      results.push(...(data || []))
    }
    
    return results
  }
}

module.exports = QueryOptimizer
