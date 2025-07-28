/**
 * Role-Based Access Control (RBAC) Service
 * Manages permissions and access control for different user roles
 */

// Define role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
  'faculty': 1,
  'security': 2,
  'hod': 3,
  'security_incharge': 4,
  'admin': 5
};

// Define permissions for each role
const ROLE_PERMISSIONS = {
  faculty: [
    'keys:view_own',
    'keys:request',
    'keys:return',
    'profile:view_own',
    'profile:update_own',
    'history:view_own'
  ],
  security: [
    'keys:view_all',
    'keys:scan',
    'keys:approve_return',
    'keys:track_location',
    'transactions:view_all',
    'profile:view_own',
    'profile:update_own',
    'reports:view_daily'
  ],
  hod: [
    'keys:view_department',
    'keys:approve_request',
    'keys:assign',
    'faculty:view_department',
    'faculty:manage_department',
    'reports:view_department',
    'analytics:view_department',
    'profile:view_own',
    'profile:update_own'
  ],
  security_incharge: [
    'keys:view_all',
    'keys:manage_all',
    'keys:scan',
    'keys:approve_return',
    'keys:track_location',
    'security:manage',
    'transactions:view_all',
    'reports:view_all',
    'analytics:view_all',
    'profile:view_own',
    'profile:update_own',
    'users:view_security'
  ],

};

// Define route access patterns
const ROUTE_ACCESS = {
  '/faculty': ['faculty', 'hod'],
  '/security': ['security', 'security_incharge'],
  '/hod': ['hod'],
  '/securityincharge': ['security_incharge']
};

class RBACService {
  /**
   * Check if a role has a specific permission
   * @param {string} role - User role
   * @param {string} permission - Permission to check
   * @returns {boolean} Whether the role has the permission
   */
  hasPermission(role, permission) {
    if (!role || !permission) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Check if a role has any of the specified permissions
   * @param {string} role - User role
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} Whether the role has any of the permissions
   */
  hasAnyPermission(role, permissions) {
    if (!role || !Array.isArray(permissions)) return false;
    
    return permissions.some(permission => this.hasPermission(role, permission));
  }

  /**
   * Check if a role has all of the specified permissions
   * @param {string} role - User role
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} Whether the role has all of the permissions
   */
  hasAllPermissions(role, permissions) {
    if (!role || !Array.isArray(permissions)) return false;
    
    return permissions.every(permission => this.hasPermission(role, permission));
  }

  /**
   * Get all permissions for a role
   * @param {string} role - User role
   * @returns {string[]} Array of permissions
   */
  getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if a role can access a specific route
   * @param {string} role - User role
   * @param {string} route - Route path
   * @returns {boolean} Whether the role can access the route
   */
  canAccessRoute(role, route) {
    if (!role || !route) return false;

    // Check exact route matches
    for (const [routePattern, allowedRoles] of Object.entries(ROUTE_ACCESS)) {
      if (route.startsWith(routePattern)) {
        return allowedRoles.includes(role);
      }
    }

    // Default: allow access to public routes
    const publicRoutes = ['/', '/login', '/register', '/health'];
    return publicRoutes.some(publicRoute => route === publicRoute);
  }

  /**
   * Check if a role has sufficient hierarchy level
   * @param {string} userRole - User's role
   * @param {string} requiredRole - Required minimum role
   * @returns {boolean} Whether the user role meets the requirement
   */
  hasRoleLevel(userRole, requiredRole) {
    if (!userRole || !requiredRole) return false;
    
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  }

  /**
   * Get role hierarchy level
   * @param {string} role - User role
   * @returns {number} Role hierarchy level
   */
  getRoleLevel(role) {
    return ROLE_HIERARCHY[role] || 0;
  }

  /**
   * Check if user can manage another user based on roles
   * @param {string} managerRole - Manager's role
   * @param {string} targetRole - Target user's role
   * @returns {boolean} Whether manager can manage target user
   */
  canManageUser(managerRole, targetRole) {
    if (!managerRole || !targetRole) return false;

    // Admin can manage everyone
    if (managerRole === 'admin') return true;

    // Security incharge can manage security staff
    if (managerRole === 'security_incharge' && targetRole === 'security') return true;

    // HOD can manage faculty in their department (additional check needed for department)
    if (managerRole === 'hod' && targetRole === 'faculty') return true;

    // Users cannot manage users of equal or higher hierarchy
    return this.getRoleLevel(managerRole) > this.getRoleLevel(targetRole);
  }

  /**
   * Get dashboard URL for a role
   * @param {string} role - User role
   * @returns {string} Dashboard URL
   */
  getDashboardUrl(role) {
    const dashboardUrls = {
      'faculty': '/faculty',
      'security': '/security',
      'hod': '/hod',
      'security_incharge': '/securityincharge',
      'admin': '/admin'
    };

    return dashboardUrls[role] || '/';
  }

  /**
   * Get navigation items for a role
   * @param {string} role - User role
   * @returns {Object[]} Array of navigation items
   */
  getNavigationItems(role) {
    const navigationItems = {
      faculty: [
        { id: 'keys', label: 'My Keys', path: '/faculty/keys', icon: 'key' },
        { id: 'request', label: 'Request Key', path: '/faculty/request', icon: 'plus' },
        { id: 'history', label: 'History', path: '/faculty/history', icon: 'history' }
      ],
      security: [
        { id: 'scan', label: 'Scan QR', path: '/security/scan', icon: 'scan' },
        { id: 'pending', label: 'Pending Returns', path: '/security/pending', icon: 'clock' },
        { id: 'logs', label: 'Today\'s Logs', path: '/security/logs', icon: 'list' }
      ],
      hod: [
        { id: 'overview', label: 'Overview', path: '/hod/overview', icon: 'dashboard' },
        { id: 'faculty', label: 'Faculty Management', path: '/hod/faculty', icon: 'users' },
        { id: 'keys', label: 'Department Keys', path: '/hod/keys', icon: 'key' },
        { id: 'analytics', label: 'Analytics', path: '/hod/analytics', icon: 'chart' }
      ],
      security_incharge: [
        { id: 'dashboard', label: 'Dashboard', path: '/securityincharge/dashboard', icon: 'dashboard' },
        { id: 'security', label: 'Security Staff', path: '/securityincharge/security', icon: 'shield' },
        { id: 'keys', label: 'All Keys', path: '/securityincharge/keys', icon: 'key' },
        { id: 'reports', label: 'Reports', path: '/securityincharge/reports', icon: 'report' }
      ],

    };

    return navigationItems[role] || [];
  }

  /**
   * Validate role
   * @param {string} role - Role to validate
   * @returns {boolean} Whether the role is valid
   */
  isValidRole(role) {
    return Object.keys(ROLE_HIERARCHY).includes(role);
  }

  /**
   * Get all available roles
   * @returns {string[]} Array of all roles
   */
  getAllRoles() {
    return Object.keys(ROLE_HIERARCHY);
  }

  /**
   * Get role display name
   * @param {string} role - Role code
   * @returns {string} Human-readable role name
   */
  getRoleDisplayName(role) {
    const displayNames = {
      'faculty': 'Faculty',
      'security': 'Security',
      'hod': 'Head of Department',
      'security_incharge': 'Security Incharge',
      'admin': 'Administrator'
    };

    return displayNames[role] || role;
  }
}

module.exports = new RBACService();
