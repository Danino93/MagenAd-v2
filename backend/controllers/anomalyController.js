// backend/controllers/anomalyController.js
// Anomaly Bulk Operations Controller - MagenAd V2

const supabase = require('../config/supabase');

/**
 * Bulk Resolve Anomalies
 * POST /api/anomalies/bulk-resolve
 */
exports.bulkResolve = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { ids, accountId } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }

    // Verify account belongs to user
    if (accountId) {
      const { data: account, error: accountError } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

      if (accountError || !account) {
        return res.status(404).json({ message: 'Account not found' });
      }
    }

    // Get all anomalies to verify they belong to user's accounts
    let query = supabase
      .from('fraud_detections')
      .select('id, ad_account_id')
      .in('id', ids);

    if (accountId) {
      query = query.eq('ad_account_id', accountId);
    } else {
      // Get all account IDs for user
      const { data: accounts } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('user_id', userId);
      
      if (accounts && accounts.length > 0) {
        query = query.in('ad_account_id', accounts.map(a => a.id));
      } else {
        return res.status(404).json({ message: 'No accounts found' });
      }
    }

    const { data: anomalies, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!anomalies || anomalies.length === 0) {
      return res.status(404).json({ message: 'No anomalies found' });
    }

    const validIds = anomalies.map(a => a.id);

    // Update anomalies
    const { data: updated, error: updateError } = await supabase
      .from('fraud_detections')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', validIds)
      .select('id');

    if (updateError) throw updateError;
    
    res.json({
      success: true,
      message: `${updated?.length || 0} anomalies resolved`,
      count: updated?.length || 0,
      ids: updated?.map(r => r.id) || []
    });
  } catch (error) {
    console.error('Bulk resolve error:', error);
    res.status(500).json({ message: 'Failed to resolve anomalies', error: error.message });
  }
};

/**
 * Bulk Dismiss Anomalies
 * POST /api/anomalies/bulk-dismiss
 */
exports.bulkDismiss = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { ids, accountId } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }

    // Verify account belongs to user
    if (accountId) {
      const { data: account, error: accountError } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

      if (accountError || !account) {
        return res.status(404).json({ message: 'Account not found' });
      }
    }

    // Get all anomalies to verify they belong to user's accounts
    let query = supabase
      .from('fraud_detections')
      .select('id, ad_account_id')
      .in('id', ids);

    if (accountId) {
      query = query.eq('ad_account_id', accountId);
    } else {
      const { data: accounts } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('user_id', userId);
      
      if (accounts && accounts.length > 0) {
        query = query.in('ad_account_id', accounts.map(a => a.id));
      } else {
        return res.status(404).json({ message: 'No accounts found' });
      }
    }

    const { data: anomalies, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!anomalies || anomalies.length === 0) {
      return res.status(404).json({ message: 'No anomalies found' });
    }

    const validIds = anomalies.map(a => a.id);

    // Update anomalies
    const { data: updated, error: updateError } = await supabase
      .from('fraud_detections')
      .update({
        status: 'dismissed',
        updated_at: new Date().toISOString()
      })
      .in('id', validIds)
      .select('id');

    if (updateError) throw updateError;
    
    res.json({
      success: true,
      message: `${updated?.length || 0} anomalies dismissed`,
      count: updated?.length || 0,
      ids: updated?.map(r => r.id) || []
    });
  } catch (error) {
    console.error('Bulk dismiss error:', error);
    res.status(500).json({ message: 'Failed to dismiss anomalies', error: error.message });
  }
};

/**
 * Bulk Delete Anomalies
 * POST /api/anomalies/bulk-delete
 */
exports.bulkDelete = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { ids, accountId } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }

    // Verify account belongs to user
    if (accountId) {
      const { data: account, error: accountError } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

      if (accountError || !account) {
        return res.status(404).json({ message: 'Account not found' });
      }
    }

    // Get all anomalies to verify they belong to user's accounts
    let query = supabase
      .from('fraud_detections')
      .select('id, ad_account_id')
      .in('id', ids);

    if (accountId) {
      query = query.eq('ad_account_id', accountId);
    } else {
      const { data: accounts } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('user_id', userId);
      
      if (accounts && accounts.length > 0) {
        query = query.in('ad_account_id', accounts.map(a => a.id));
      } else {
        return res.status(404).json({ message: 'No accounts found' });
      }
    }

    const { data: anomalies, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!anomalies || anomalies.length === 0) {
      return res.status(404).json({ message: 'No anomalies found' });
    }

    const validIds = anomalies.map(a => a.id);

    // Delete anomalies
    const { data: deleted, error: deleteError } = await supabase
      .from('fraud_detections')
      .delete()
      .in('id', validIds)
      .select('id');

    if (deleteError) throw deleteError;
    
    res.json({
      success: true,
      message: `${deleted?.length || 0} anomalies deleted`,
      count: deleted?.length || 0,
      ids: deleted?.map(r => r.id) || []
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Failed to delete anomalies', error: error.message });
  }
};

/**
 * Bulk Investigate Anomalies
 * POST /api/anomalies/bulk-investigate
 */
exports.bulkInvestigate = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { ids, accountId } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }

    // Verify account belongs to user
    if (accountId) {
      const { data: account, error: accountError } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

      if (accountError || !account) {
        return res.status(404).json({ message: 'Account not found' });
      }
    }

    // Get all anomalies to verify they belong to user's accounts
    let query = supabase
      .from('fraud_detections')
      .select('id, ad_account_id')
      .in('id', ids);

    if (accountId) {
      query = query.eq('ad_account_id', accountId);
    } else {
      const { data: accounts } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('user_id', userId);
      
      if (accounts && accounts.length > 0) {
        query = query.in('ad_account_id', accounts.map(a => a.id));
      } else {
        return res.status(404).json({ message: 'No accounts found' });
      }
    }

    const { data: anomalies, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!anomalies || anomalies.length === 0) {
      return res.status(404).json({ message: 'No anomalies found' });
    }

    const validIds = anomalies.map(a => a.id);

    // Update anomalies
    const { data: updated, error: updateError } = await supabase
      .from('fraud_detections')
      .update({
        status: 'investigating',
        updated_at: new Date().toISOString()
      })
      .in('id', validIds)
      .select('id');

    if (updateError) throw updateError;
    
    res.json({
      success: true,
      message: `${updated?.length || 0} anomalies sent for investigation`,
      count: updated?.length || 0,
      ids: updated?.map(r => r.id) || []
    });
  } catch (error) {
    console.error('Bulk investigate error:', error);
    res.status(500).json({ message: 'Failed to investigate anomalies', error: error.message });
  }
};

module.exports = exports;
