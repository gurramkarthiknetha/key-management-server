/**
 * Role Service - Automatically determines user role based on email pattern
 */

class RoleService {
  /**
   * Determine user role based on email address
   * @param {string} email - User's email address
   * @returns {string} - Determined role
   */
  static determineRoleFromEmail(email) {
    if (!email || !email.endsWith('@vnrvjiet.in')) {
      throw new Error('Invalid email domain. Must be @vnrvjiet.in');
    }

    const emailPrefix = email.split('@')[0].toLowerCase();
    
    // Admin patterns
    if (emailPrefix.includes('admin') || 
        emailPrefix.includes('principal') || 
        emailPrefix.includes('director')) {
      return 'admin';
    }
    
    // Security Incharge patterns
    if (emailPrefix.includes('security.incharge') || 
        emailPrefix.includes('security.head') ||
        emailPrefix.includes('securityincharge')) {
      return 'security_incharge';
    }
    
    // Security patterns
    if (emailPrefix.includes('security')) {
      return 'security';
    }
    
    // HOD patterns
    if (emailPrefix.includes('hod') || 
        emailPrefix.includes('head') ||
        emailPrefix.includes('.hod')) {
      return 'hod';
    }
    
    // Default to faculty for all other @vnrvjiet.in emails
    return 'faculty';
  }

  /**
   * Get department from email (if possible)
   * @param {string} email - User's email address
   * @returns {string} - Department name
   */
  static determineDepartmentFromEmail(email) {
    const emailPrefix = email.split('@')[0].toLowerCase();
    
    // Department patterns
    if (emailPrefix.includes('cse') || emailPrefix.includes('cs')) {
      return 'Computer Science and Engineering';
    }
    if (emailPrefix.includes('ece') || emailPrefix.includes('ec')) {
      return 'Electronics and Communication Engineering';
    }
    if (emailPrefix.includes('eee') || emailPrefix.includes('ee')) {
      return 'Electrical and Electronics Engineering';
    }
    if (emailPrefix.includes('mech') || emailPrefix.includes('me')) {
      return 'Mechanical Engineering';
    }
    if (emailPrefix.includes('civil') || emailPrefix.includes('ce')) {
      return 'Civil Engineering';
    }
    if (emailPrefix.includes('it')) {
      return 'Information Technology';
    }
    
    // Default department
    return 'General';
  }

  /**
   * Extract name from email
   * @param {string} email - User's email address
   * @returns {string} - Formatted name
   */
  static extractNameFromEmail(email) {
    const emailPrefix = email.split('@')[0];
    
    // Remove common prefixes/suffixes
    let name = emailPrefix
      .replace(/\.(hod|head|admin|security)$/i, '')
      .replace(/^(dr|prof|mr|ms|mrs)\.?/i, '')
      .replace(/\d+$/, '') // Remove trailing numbers
      .replace(/[._-]/g, ' ') // Replace separators with spaces
      .trim();
    
    // Capitalize each word
    name = name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return name || 'User';
  }

  /**
   * Generate employee ID from email
   * @param {string} email - User's email address
   * @returns {string} - Generated employee ID
   */
  static generateEmployeeIdFromEmail(email) {
    const emailPrefix = email.split('@')[0];
    const role = this.determineRoleFromEmail(email);
    
    // Create a simple employee ID based on email and role
    const rolePrefix = {
      'admin': 'ADM',
      'security_incharge': 'SEC',
      'security': 'SEC',
      'hod': 'HOD',
      'faculty': 'FAC'
    };
    
    const prefix = rolePrefix[role] || 'EMP';
    const suffix = emailPrefix.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    
    return `${prefix}${suffix}`;
  }

  /**
   * Create complete user profile from email
   * @param {string} email - User's email address
   * @returns {Object} - Complete user profile
   */
  static createUserProfileFromEmail(email) {
    if (!email || !email.endsWith('@vnrvjiet.in')) {
      throw new Error('Invalid email domain. Must be @vnrvjiet.in');
    }

    return {
      email: email.toLowerCase(),
      name: this.extractNameFromEmail(email),
      employeeId: this.generateEmployeeIdFromEmail(email),
      role: this.determineRoleFromEmail(email),
      department: this.determineDepartmentFromEmail(email),
      isEmailVerified: true, // Auto-verify since it's from vnrvjiet.in
      isActive: true
    };
  }

  /**
   * Validate email format and domain
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether email is valid
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@vnrvjiet\.in$/;
    return emailRegex.test(email);
  }

  /**
   * Get role display name
   * @param {string} role - Role code
   * @returns {string} - Human-readable role name
   */
  static getRoleDisplayName(role) {
    const displayNames = {
      'faculty': 'Faculty',
      'security': 'Security Personnel',
      'hod': 'Head of Department',
      'security_incharge': 'Security Incharge',
      'admin': 'Administrator'
    };

    return displayNames[role] || role;
  }

  /**
   * Get dashboard URL for role
   * @param {string} role - User role
   * @returns {string} - Dashboard URL
   */
  static getDashboardUrl(role) {
    const dashboardUrls = {
      'faculty': '/faculty',
      'security': '/security',
      'hod': '/hod',
      'security_incharge': '/securityincharge',
      'admin': '/admin'
    };

    return dashboardUrls[role] || '/faculty';
  }
}

module.exports = RoleService;
