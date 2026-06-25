import router from './router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { ElMessage } from 'element-plus/es';
import { getToken } from '@/utils/auth';
import { isHttp, isPathMatch } from '@/utils/validate';
import { isRelogin } from '@/utils/request';
import { useUserStore } from '@/store/modules/user';
import { useSettingsStore } from '@/store/modules/settings';
import { usePermissionStore } from '@/store/modules/permission';

NProgress.configure({ showSpinner: false });

const whiteList = ['/login', '/register', '/social-callback', '/register*', '/register/*'];

const isWhiteList = (path: string) => {
  return whiteList.some((pattern) => isPathMatch(pattern, path));
};

// 会话失效（无效会话/会话已过期）属于预期登出，不再弹错误提示，避免登录页噪音；其余异常正常提示。
const isInvalidSessionError = (err: unknown) => String(err).includes('无效的会话') || String(err).includes('会话已过期');

// 非管理员落地首个可访问页的支撑函数（来自渠道推广分支）：
// 管理员保留停留在首页，普通用户进入 / 或 /index 时自动落到其首个可访问业务页。
const isAdminUser = () => useUserStore().roles.some((role) => ['superadmin', 'admin'].includes(role));

const joinRoutePath = (parentPath: string, childPath: string) => {
  if (childPath.startsWith('/')) return childPath;
  return `${parentPath.replace(/\/$/, '')}/${childPath}`.replace(/\/+/g, '/');
};

const firstAccessiblePath = (routes: any[], parentPath = ''): string => {
  for (const route of routes) {
    if (route.hidden) continue;

    const currentPath = joinRoutePath(parentPath, route.path || '');

    if (route.children?.length) {
      const childPath = firstAccessiblePath(route.children, currentPath);
      if (childPath) return childPath;
    }

    if (currentPath && currentPath !== '/' && currentPath !== '/index') {
      return currentPath;
    }
  }

  return '/user/profile';
};

const shouldLeaveHome = (path: string) => !isAdminUser() && (path === '/' || path === '/index');

router.beforeEach(async (to) => {
  NProgress.start();
  if (getToken()) {
    const userStore = useUserStore();
    const permissionStore = usePermissionStore();
    to.meta.title && useSettingsStore().setTitle(to.meta.title as string);
    /* has token*/
    if (to.path === '/login') {
      NProgress.done();
      // 登录页是重新建立会话的入口；只有已验证过用户信息的会话才允许跳回首页。
      if (userStore.roles.length > 0) {
        return { path: '/' };
      }
      userStore.clearSession();
      return true;
    } else if (isWhiteList(to.path)) {
      return true;
    } else {
      if (userStore.roles.length === 0) {
        isRelogin.show = true;
        try {
          // getInfo 与 generateRoutes 互不依赖（getRouters 已在后端按权限过滤），并行拉取以减少首屏等待；
          // Promise.all resolve 后 roles 已写入，shouldLeaveHome 的角色判断可靠。
          const [, accessRoutes] = await Promise.all([userStore.getInfo(), permissionStore.generateRoutes()]);
          // 根据后端返回的路由表动态添加可访问路由
          accessRoutes.forEach((route: any) => {
            if (!isHttp(route.path)) {
              router.addRoute(route); // 动态添加可访问路由表
            }
          });
          // 普通用户首登从首页自动落到首个可访问页；其余情况重进当前地址，确保命中新注册的页面组件。
          if (shouldLeaveHome(to.path)) {
            return { path: firstAccessiblePath(accessRoutes), replace: true };
          }
          return to.name
            ? { name: to.name, replace: true, params: to.params, query: to.query, hash: to.hash }
            : { path: to.path, replace: true, query: to.query, hash: to.hash };
        } catch (err) {
          // 任一请求失败（最常见 token 失效 401）→ 清理会话并跳登录页，避免导航抛错导致白屏
          userStore.clearSession();
          if (!isInvalidSessionError(err)) {
            ElMessage.error(err instanceof Error ? err.message : String(err));
          }
          return `/login?redirect=${encodeURIComponent(to.fullPath)}`;
        } finally {
          isRelogin.show = false; // 两分支重复的复位收敛到 finally
        }
      } else {
        // 已建立会话的普通用户若停在首页，落到首个可访问页（侧边栏路由）
        if (shouldLeaveHome(to.path)) {
          return { path: firstAccessiblePath(permissionStore.getSidebarRoutes()), replace: true };
        }
        return true;
      }
    }
  } else {
    // 没有token
    if (isWhiteList(to.path)) {
      // 在免登录白名单，直接进入
      return true;
    } else {
      const redirect = encodeURIComponent(to.fullPath || '/');
      NProgress.done();
      return `/login?redirect=${redirect}`; // 否则全部重定向到登录页
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});
