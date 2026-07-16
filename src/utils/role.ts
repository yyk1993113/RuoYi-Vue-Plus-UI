// 运营主管历史上出现过不同权限字符；统一在一处兼容，当前后端标准值为 operations_manager。
const OPERATIONS_MANAGER_ROLE_KEYS = new Set(['operations_manager', 'operation_manager', 'operator_manager']);

export const hasOperationsManagerRole = (roles: readonly string[]): boolean => roles.some((role) => OPERATIONS_MANAGER_ROLE_KEYS.has(role));
