/** Hub is an operations system; customer, investor and board roles alone never open it. */
export function hasHubAccess(roles: readonly string[]): boolean {
  return roles.some(role => ['staff', 'back_office', 'admin', 'super_admin'].includes(role));
}
