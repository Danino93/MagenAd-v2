const express = require('express');
const router = express.Router();
const googleAdsService = require('../services/GoogleAdsService');
const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

/**
 * Middleware: Verify JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('❌ JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    // Make sure we have the user ID
    req.user = {
      id: decoded.userId || decoded.id || decoded.user_id,
      email: decoded.email
    };
    
    if (!req.user.id) {
      console.error('❌ No user ID in token:', decoded);
      return res.status(403).json({ error: 'Invalid token: missing user ID' });
    }
    
    next();
  });
};

/**
 * GET /api/googleads/auth
 * Get OAuth URL to connect Google Ads account
 */
router.get('/auth', authenticateToken, (req, res) => {
  try {
    const authUrl = googleAdsService.getAuthUrl();
    
    // Store user_id in session/state for callback
    const state = Buffer.from(JSON.stringify({ 
      user_id: req.user.id 
    })).toString('base64');
    
    const urlWithState = `${authUrl}&state=${state}`;
    
    res.json({ authUrl: urlWithState });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

/**
 * GET /api/googleads/callback
 * Handle OAuth callback from Google
 */
router.get('/callback', async (req, res) => {
  try {
    console.log('🔵 Google Ads callback received:', { 
      hasCode: !!req.query.code, 
      hasState: !!req.query.state,
      hasError: !!req.query.error 
    });

    const { code, state, error } = req.query;

    if (error) {
      console.error('❌ OAuth error:', error);
      return res.redirect(`http://localhost:5173/app/connect-ads?error=${error}`);
    }

    if (!code) {
      console.error('❌ No code in callback');
      return res.redirect('http://localhost:5173/app/connect-ads?error=no_code');
    }

    if (!state) {
      console.error('❌ No state in callback');
      return res.redirect('http://localhost:5173/app/connect-ads?error=no_state');
    }

    // Decode state to get user_id
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.user_id;
      console.log('✅ Decoded user_id:', userId);
    } catch (e) {
      console.error('❌ Failed to decode state:', e);
      return res.redirect('http://localhost:5173/app/connect-ads?error=invalid_state');
    }

    // Exchange code for tokens
    console.log('🔄 Exchanging code for tokens...');
    const tokens = await googleAdsService.getTokensFromCode(code);
    console.log('✅ Tokens received');

    // Get list of accessible customers
    console.log('🔄 Fetching accessible customers...');
    const customers = await googleAdsService.listAccessibleCustomers(tokens.refresh_token);
    console.log('✅ Found customers:', customers.length);

    // Store tokens in database (ad_accounts table)
    // For now, we'll store the first customer
    // In production, let user choose which account to connect
    
    if (customers.length > 0) {
      const customerId = customers[0].split('/').pop();
      console.log('📊 Processing customer:', customerId);
      
      // Get customer details
      console.log('🔄 Fetching customer details...');
      const customerInfo = await googleAdsService.getCustomer(customerId, tokens.refresh_token);
      console.log('✅ Customer details received:', customerInfo.customer.descriptive_name);

      // Save to database
      console.log('💾 Saving to database...');
      const { data, error: dbError } = await supabase
        .from('ad_accounts')
        .insert({
          user_id: userId,
          google_customer_id: customerId,
          account_name: customerInfo.customer.descriptive_name || 'Google Ads Account',
          refresh_token: tokens.refresh_token,
          currency: customerInfo.customer.currency_code || 'ILS',
          is_active: true,
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        // Check if it's a duplicate entry
        if (dbError.code === '23505') {
          console.log('⚠️ Account already exists, updating...');
          // Update existing account
          const { data: updatedData, error: updateError } = await supabase
            .from('ad_accounts')
            .update({
              refresh_token: tokens.refresh_token,
              is_active: true,
            })
            .eq('user_id', userId)
            .eq('google_customer_id', customerId)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Update error:', updateError);
            return res.redirect('http://localhost:5173/app/connect-ads?error=database_error');
          }
          console.log('✅ Account updated successfully');
        } else {
          return res.redirect('http://localhost:5173/app/connect-ads?error=database_error');
        }
      } else {
        console.log('✅ Account saved successfully');
      }

      // Redirect to success page
      console.log('✅ Redirecting to success page...');
      res.redirect('http://localhost:5173/app/connect-ads?success=true');
    } else {
      console.error('❌ No customers found');
      res.redirect('http://localhost:5173/app/connect-ads?error=no_customers');
    }
  } catch (error) {
    console.error('❌ Callback error:', error);
    console.error('Error stack:', error.stack);
    
    // Extract meaningful error message
    let errorMessage = 'Failed to connect Google Ads account';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.errors && Array.isArray(error.errors)) {
      const firstError = error.errors[0];
      if (firstError.message) {
        errorMessage = firstError.message;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Encode the error message properly
    const encodedError = encodeURIComponent(errorMessage);
    res.redirect(`http://localhost:5173/app/connect-ads?error=${encodedError}`);
  }
});

/**
 * GET /api/googleads/accounts
 * Get connected Google Ads accounts for user
 */
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    res.json({ accounts: data || [] });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

/**
 * GET /api/googleads/campaigns/:accountId
 * Get campaigns for a connected account
 */
router.get('/campaigns/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;

    // Get account from database
    const { data: account, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get campaigns from Google Ads API
    const campaigns = await googleAdsService.getCampaigns(
      account.customer_id,
      account.refresh_token
    );

    res.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * POST /api/googleads/test-connection/:accountId
 * Test connection to Google Ads account
 */
router.post('/test-connection/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;

    // Get account from database
    const { data: account, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Test connection
    const result = await googleAdsService.testConnection(
      account.customer_id,
      account.refresh_token
    );

    res.json(result);
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ error: 'Failed to test connection' });
  }
});

/**
 * DELETE /api/googleads/accounts/:accountId
 * Disconnect Google Ads account
 */
router.delete('/accounts/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;

    const { error } = await supabase
      .from('ad_accounts')
      .update({ is_active: false })
      .eq('id', accountId)
      .eq('user_id', req.user.id);

    if (error) {
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

module.exports = router;