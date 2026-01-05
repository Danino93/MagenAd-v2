/*
 * RBACService.js - Role-Based Access Control
 * 
 * מערכת ניהול הרשאות:
 * - User Roles (Admin, Manager, Viewer, Analyst)
 * - Permissions System (read, write, delete, manage)
 * - Team Management
 * - Audit Logs
 * - Role Assignment
 * - Permission Checks
 */

const supabase = require('../config/supabase');

class RBACService {
  constructor() {
    // הגדרת תפקידים ברירת מחדל
    this.roles = {
      admin: {
        name: 'Admin',
        nameHe: 'מנהל',
        level: 100,
        permissions: ['*'] // כל ההרשאות
      },
      manager: {
        name: 'Manager',
        nameHe: 'מנהל פרויקט',
        level: 75,
        permissions: [
          'view_dashboard',
          'view_reports',
          'create_reports',
          'view_alerts',
          'manage_alerts',
          'view_detections',
          'manage_detection_rules',
          'view_analytics',
          'manage_ip_blocking',
          'view_team'
        ]
      },
      analyst: {
        name: 'Analyst',
        nameHe: 'אנליסט',
        level: 50,
        permissions: [
          'view_dashboard',
          'view_reports',
          'create_reports',
          'view_alerts',
          'view_detections',
          'view_analytics'
        ]
      },
      viewer: {
        name: 'Viewer',
        nameHe: 'צופה',
        level: 25,
        permissions: [
          'view_dashboard',
          'view_reports',
          'view_alerts',
          'view_detections'
        ]
      }
    };
  }

  /**
   * הוספת משתמש לצוות
   */
  async addTeamMember(accountId, invitedBy, memberData) {
    try {
      const { email, role, permissions = [] } = memberData;

      // בדיקת הרשאות המזמין
      const canInvite = await this.checkPermission(invitedBy, accountId, 'manage_team');
      if (!canInvite) {
        throw new Error('אין הרשאה להוסיף חברי צוות');
      }

      // בדיקה אם המשתמש קיים
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      let userId = existingUser?.id;

      // אם לא קיים, צור הזמנה
      if (!userId) {
        const { data: invitation } = await supabase
          .from('team_invitations')
          .insert({
            ad_account_id: accountId,
            email,
            role,
            permissions,
            invited_by: invitedBy,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single();

        console.log('✅ הזמנה נשלחה:', email);
        return { type: 'invitation', data: invitation };
      }

      // הוסף לצוות
      const { data: member } = await supabase
        .from('team_members')
        .insert({
          ad_account_id: accountId,
          user_id: userId,
          role,
          permissions,
          added_by: invitedBy,
          joined_at: new Date().toISOString()
        })
        .select()
        .single();

      // Audit log
      await this.logAction(invitedBy, accountId, 'team_member_added', {
        member_id: userId,
        role
      });

      console.log('✅ חבר צוות נוסף:', email);
      return { type: 'member', data: member };
    } catch (error) {
      console.error('שגיאה בהוספת חבר צוות:', error);
      throw error;
    }
  }

  /**
   * עדכון תפקיד משתמש
   */
  async updateMemberRole(actorId, accountId, memberId, newRole) {
    try {
      // בדיקת הרשאות
      const canManage = await this.checkPermission(actorId, accountId, 'manage_team');
      if (!canManage) {
        throw new Error('אין הרשאה לעדכן תפקידים');
      }

      // בדיקה שהתפקיד החדש קיים
      if (!this.roles[newRole]) {
        throw new Error('תפקיד לא חוקי');
      }

      // עדכון התפקיד
      const { data } = await supabase
        .from('team_members')
        .update({
          role: newRole,
          permissions: this.roles[newRole].permissions,
          updated_at: new Date().toISOString()
        })
        .eq('ad_account_id', accountId)
        .eq('user_id', memberId)
        .select()
        .single();

      // Audit log
      await this.logAction(actorId, accountId, 'role_updated', {
        member_id: memberId,
        new_role: newRole
      });

      console.log('✅ תפקיד עודכן:', memberId, '→', newRole);
      return data;
    } catch (error) {
      console.error('שגיאה בעדכון תפקיד:', error);
      throw error;
    }
  }

  /**
   * הסרת חבר צוות
   */
  async removeMember(actorId, accountId, memberId) {
    try {
      const canManage = await this.checkPermission(actorId, accountId, 'manage_team');
      if (!canManage) {
        throw new Error('אין הרשאה להסיר חברי צוות');
      }

      // הסרה
      await supabase
        .from('team_members')
        .delete()
        .eq('ad_account_id', accountId)
        .eq('user_id', memberId);

      // Audit log
      await this.logAction(actorId, accountId, 'team_member_removed', {
        member_id: memberId
      });

      console.log('✅ חבר צוות הוסר:', memberId);
    } catch (error) {
      console.error('שגיאה בהסרת חבר צוות:', error);
      throw error;
    }
  }

  /**
   * קבלת חברי צוות
   */
  async getTeamMembers(userId, accountId) {
    try {
      // בדיקת הרשאות
      const canView = await this.checkPermission(userId, accountId, 'view_team');
      if (!canView) {
        throw new Error('אין הרשאה לצפות בצוות');
      }

      const { data: members } = await supabase
        .from('team_members')
        .select(`
          *,
          user:users(id, email, full_name)
        `)
        .eq('ad_account_id', accountId);

      return members || [];
    } catch (error) {
      console.error('שגיאה בשליפת חברי צוות:', error);
      throw error;
    }
  }

  /**
   * בדיקת הרשאה
   */
  async checkPermission(userId, accountId, permission) {
    try {
      // שליפת תפקיד המשתמש
      const { data: member } = await supabase
        .from('team_members')
        .select('role, permissions')
        .eq('ad_account_id', accountId)
        .eq('user_id', userId)
        .single();

      if (!member) {
        // אולי המשתמש הוא בעל החשבון
        const { data: account } = await supabase
          .from('ad_accounts')
          .select('user_id')
          .eq('id', accountId)
          .single();

        if (account?.user_id === userId) {
          return true; // בעל החשבון = admin
        }

        return false;
      }

      const roleConfig = this.roles[member.role];
      
      // Admin יכול הכל
      if (roleConfig.permissions.includes('*')) {
        return true;
      }

      // בדיקה בהרשאות התפקיד
      if (roleConfig.permissions.includes(permission)) {
        return true;
      }

      // בדיקה בהרשאות מותאמות אישית
      if (member.permissions?.includes(permission)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('שגיאה בבדיקת הרשאה:', error);
      return false;
    }
  }

  /**
   * קבלת תפקיד משתמש
   */
  async getUserRole(userId, accountId) {
    try {
      // בדיקה אם בעל החשבון
      const { data: account } = await supabase
        .from('ad_accounts')
        .select('user_id')
        .eq('id', accountId)
        .single();

      if (account?.user_id === userId) {
        return {
          role: 'admin',
          config: this.roles.admin,
          isOwner: true
        };
      }

      // שליפת תפקיד מצוות
      const { data: member } = await supabase
        .from('team_members')
        .select('role, permissions')
        .eq('ad_account_id', accountId)
        .eq('user_id', userId)
        .single();

      if (!member) {
        return null;
      }

      return {
        role: member.role,
        config: this.roles[member.role],
        permissions: member.permissions,
        isOwner: false
      };
    } catch (error) {
      console.error('שגיאה בשליפת תפקיד:', error);
      return null;
    }
  }

  /**
   * רישום פעולה (Audit Log)
   */
  async logAction(userId, accountId, action, details = {}) {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          ad_account_id: accountId,
          action,
          details,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('שגיאה ברישום audit log:', error);
    }
  }

  /**
   * קבלת Audit Logs
   */
  async getAuditLogs(userId, accountId, options = {}) {
    try {
      const canView = await this.checkPermission(userId, accountId, 'view_audit_logs');
      if (!canView) {
        throw new Error('אין הרשאה לצפות בלוגים');
      }

      const { limit = 100, offset = 0, action = null } = options;

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(email, full_name)
        `)
        .eq('ad_account_id', accountId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (action) {
        query = query.eq('action', action);
      }

      const { data } = await query;
      return data || [];
    } catch (error) {
      console.error('שגיאה בשליפת audit logs:', error);
      throw error;
    }
  }

  /**
   * קבלת כל התפקידים הזמינים
   */
  getAvailableRoles() {
    return Object.entries(this.roles).map(([key, config]) => ({
      key,
      name: config.name,
      nameHe: config.nameHe,
      level: config.level,
      permissions: config.permissions
    }));
  }

  /**
   * בדיקה אם משתמש יכול לגשת לחשבון
   */
  async canAccessAccount(userId, accountId) {
    try {
      // בעל החשבון
      const { data: account } = await supabase
        .from('ad_accounts')
        .select('user_id')
        .eq('id', accountId)
        .single();

      if (account?.user_id === userId) {
        return true;
      }

      // חבר צוות
      const { data: member } = await supabase
        .from('team_members')
        .select('id')
        .eq('ad_account_id', accountId)
        .eq('user_id', userId)
        .single();

      return !!member;
    } catch (error) {
      return false;
    }
  }

  /**
   * קבלת כל החשבונות שהמשתמש יכול לגשת אליהם
   */
  async getUserAccounts(userId) {
    try {
      // חשבונות שהמשתמש הוא הבעלים שלהם
      const { data: ownedAccounts } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('user_id', userId);

      // חשבונות שהמשתמש חבר בצוות שלהם
      const { data: teamAccounts } = await supabase
        .from('team_members')
        .select(`
          role,
          ad_account:ad_accounts(*)
        `)
        .eq('user_id', userId);

      const accounts = [
        ...(ownedAccounts || []).map(acc => ({
          ...acc,
          role: 'admin',
          isOwner: true
        })),
        ...(teamAccounts || []).map(tm => ({
          ...tm.ad_account,
          role: tm.role,
          isOwner: false
        }))
      ];

      return accounts;
    } catch (error) {
      console.error('שגיאה בשליפת חשבונות:', error);
      return [];
    }
  }
}

module.exports = new RBACService();