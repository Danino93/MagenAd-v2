/*
 * IPBlockingService.js
 * 
 * IP Blocking & Whitelist Management:
 * - Blacklist management (manual + auto)
 * - Whitelist management
 * - Auto-blocking rules
 * - IP range blocking (CIDR)
 * - Block expiration
 * - Block statistics
 */

const supabase = require('../config/supabase');

class IPBlockingService {
  /**
   * Add IP to blacklist
   */
  async blockIP(accountId, ipData) {
    try {
      const {
        ipAddress,
        reason,
        source = 'manual',
        expiresAt = null,
        blockType = 'full',
        notes = null
      } = ipData;

      // Check if already blocked
      const { data: existing } = await supabase
        .from('ip_blacklist')
        .select('id')
        .eq('ad_account_id', accountId)
        .eq('ip_address', ipAddress)
        .eq('status', 'active')
        .single();

      if (existing) {
        throw new Error('IP already blocked');
      }

      // Add to blacklist
      const { data, error } = await supabase
        .from('ip_blacklist')
        .insert({
          ad_account_id: accountId,
          ip_address: ipAddress,
          reason,
          source,
          block_type: blockType,
          expires_at: expiresAt,
          notes,
          status: 'active',
          blocked_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Blocked IP: ${ipAddress}`);
      return data;
    } catch (error) {
      console.error('Error blocking IP:', error);
      throw error;
    }
  }

  /**
   * Remove IP from blacklist
   */
  async unblockIP(accountId, ipAddress) {
    try {
      const { data, error } = await supabase
        .from('ip_blacklist')
        .update({ 
          status: 'inactive',
          unblocked_at: new Date().toISOString()
        })
        .eq('ad_account_id', accountId)
        .eq('ip_address', ipAddress)
        .eq('status', 'active')
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Unblocked IP: ${ipAddress}`);
      return data;
    } catch (error) {
      console.error('Error unblocking IP:', error);
      throw error;
    }
  }

  /**
   * Add IP to whitelist
   */
  async whitelistIP(accountId, ipData) {
    try {
      const {
        ipAddress,
        reason,
        notes = null
      } = ipData;

      // Check if already whitelisted
      const { data: existing } = await supabase
        .from('ip_whitelist')
        .select('id')
        .eq('ad_account_id', accountId)
        .eq('ip_address', ipAddress)
        .single();

      if (existing) {
        throw new Error('IP already whitelisted');
      }

      // Add to whitelist
      const { data, error } = await supabase
        .from('ip_whitelist')
        .insert({
          ad_account_id: accountId,
          ip_address: ipAddress,
          reason,
          notes,
          added_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Whitelisted IP: ${ipAddress}`);
      return data;
    } catch (error) {
      console.error('Error whitelisting IP:', error);
      throw error;
    }
  }

  /**
   * Remove IP from whitelist
   */
  async removeFromWhitelist(accountId, ipAddress) {
    try {
      const { error } = await supabase
        .from('ip_whitelist')
        .delete()
        .eq('ad_account_id', accountId)
        .eq('ip_address', ipAddress);

      if (error) throw error;

      console.log(`✅ Removed from whitelist: ${ipAddress}`);
      return true;
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      throw error;
    }
  }

  /**
   * Check if IP is blocked
   */
  async isBlocked(accountId, ipAddress) {
    try {
      const { data, error } = await supabase
        .from('ip_blacklist')
        .select('*')
        .eq('ad_account_id', accountId)
        .eq('ip_address', ipAddress)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Check expiration
      if (data && data.expires_at) {
        if (new Date(data.expires_at) < new Date()) {
          // Expired - unblock
          await this.unblockIP(accountId, ipAddress);
          return false;
        }
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if IP blocked:', error);
      return false;
    }
  }

  /**
   * Check if IP is whitelisted
   */
  async isWhitelisted(accountId, ipAddress) {
    try {
      const { data, error } = await supabase
        .from('ip_whitelist')
        .select('id')
        .eq('ad_account_id', accountId)
        .eq('ip_address', ipAddress)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return !!data;
    } catch (error) {
      console.error('Error checking if IP whitelisted:', error);
      return false;
    }
  }

  /**
   * Auto-block based on detection
   */
  async autoBlockFromDetection(detection) {
    try {
      const { ad_account_id, event_id, severity, fraud_score } = detection;

      // Get IP from event
      const { data: event } = await supabase
        .from('raw_events')
        .select('ip_address')
        .eq('id', event_id)
        .single();

      if (!event?.ip_address) return null;

      // Check if whitelisted
      const whitelisted = await this.isWhitelisted(ad_account_id, event.ip_address);
      if (whitelisted) {
        console.log(`IP ${event.ip_address} is whitelisted - skip auto-block`);
        return null;
      }

      // Auto-block criteria
      const shouldBlock = (
        severity === 'critical' && fraud_score >= 80
      );

      if (!shouldBlock) return null;

      // Calculate expiration (24 hours for auto-blocks)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Block IP
      return await this.blockIP(ad_account_id, {
        ipAddress: event.ip_address,
        reason: `Auto-blocked: ${detection.pattern_type} (score: ${fraud_score})`,
        source: 'auto',
        expiresAt: expiresAt.toISOString(),
        blockType: 'temporary',
        notes: `Detection ID: ${detection.id}`
      });
    } catch (error) {
      if (error.message.includes('already blocked')) {
        console.log('IP already blocked - skip');
        return null;
      }
      console.error('Error auto-blocking IP:', error);
      return null;
    }
  }

  /**
   * Get blacklist
   */
  async getBlacklist(accountId, includeExpired = false) {
    try {
      let query = supabase
        .from('ip_blacklist')
        .select('*')
        .eq('ad_account_id', accountId)
        .order('blocked_at', { ascending: false });

      if (!includeExpired) {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting blacklist:', error);
      return [];
    }
  }

  /**
   * Get whitelist
   */
  async getWhitelist(accountId) {
    try {
      const { data, error } = await supabase
        .from('ip_whitelist')
        .select('*')
        .eq('ad_account_id', accountId)
        .order('added_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting whitelist:', error);
      return [];
    }
  }

  /**
   * Get blocking statistics
   */
  async getBlockingStats(accountId) {
    try {
      const [blacklist, whitelist] = await Promise.all([
        this.getBlacklist(accountId, false),
        this.getWhitelist(accountId)
      ]);

      const stats = {
        blocked: {
          total: blacklist.length,
          manual: blacklist.filter(b => b.source === 'manual').length,
          auto: blacklist.filter(b => b.source === 'auto').length,
          temporary: blacklist.filter(b => b.block_type === 'temporary').length,
          permanent: blacklist.filter(b => b.block_type === 'full').length
        },
        whitelisted: {
          total: whitelist.length
        }
      };

      // Get blocked clicks count
      const blockedIPs = blacklist.map(b => b.ip_address);
      
      if (blockedIPs.length > 0) {
        const { count } = await supabase
          .from('raw_events')
          .select('id', { count: 'exact', head: true })
          .eq('ad_account_id', accountId)
          .in('ip_address', blockedIPs);

        stats.blocked.clicksBlocked = count || 0;
      } else {
        stats.blocked.clicksBlocked = 0;
      }

      return stats;
    } catch (error) {
      console.error('Error getting blocking stats:', error);
      return null;
    }
  }

  /**
   * Bulk block IPs
   */
  async bulkBlockIPs(accountId, ipAddresses, reason) {
    try {
      const blocked = [];
      const failed = [];

      for (const ip of ipAddresses) {
        try {
          const result = await this.blockIP(accountId, {
            ipAddress: ip,
            reason,
            source: 'manual',
            blockType: 'full'
          });
          blocked.push(result);
        } catch (error) {
          failed.push({ ip, error: error.message });
        }
      }

      return { blocked, failed };
    } catch (error) {
      console.error('Error bulk blocking IPs:', error);
      throw error;
    }
  }

  /**
   * Clean expired blocks
   */
  async cleanExpiredBlocks() {
    try {
      const { data, error } = await supabase
        .from('ip_blacklist')
        .update({ status: 'inactive', unblocked_at: new Date().toISOString() })
        .eq('status', 'active')
        .not('expires_at', 'is', null)
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) throw error;

      console.log(`🧹 Cleaned ${data?.length || 0} expired blocks`);
      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning expired blocks:', error);
      return 0;
    }
  }
}

module.exports = new IPBlockingService();