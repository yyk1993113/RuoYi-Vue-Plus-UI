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
    if (to.meta.title) {
      useSettingsStore().setTitle(to.meta.title as string);
    }

    if (to.path === '/login') {
      return { path: '/' };
    }

    if (isWhiteList(to.path)) {
      return true;
    }

    const userStore = useUserStore();
    const permissionStore = usePermissionStore();

    if (userStore.roles.length === 0) {
      isRelogin.show = true;

      try {
        // Fetch roles before dynamic routes so non-admin users land on their first accessible page.
        await userStore.getInfo();
        const accessRoutes = await permissionStore.generateRoutes();

        accessRoutes.forEach((route: any) => {
          if (!isHttp(route.path)) {
            router.addRoute(route);
          }
        });

        if (shouldLeaveHome(to.path)) {
          return { path: firstAccessiblePath(accessRoutes), replace: true };
        }

        return {
          path: to.path,
          replace: true,
          params: to.params,
          query: to.query,
          hash: to.hash,
          name: to.name as string
        };
      } catch (err) {
        await userStore.logout();
        ElMessage.error(err instanceof Error ? err.message : String(err));
        return `/login?redirect=${encodeURIComponent(to.fullPath)}`;
      } finally {
        isRelogin.show = false;
      }
    }

    if (shouldLeaveHome(to.path)) {
      return { path: firstAccessiblePath(permissionStore.getSidebarRoutes()), replace: true };
    }

    return true;
  }

  if (isWhiteList(to.path)) {
    return true;
  }

  NProgress.done();
  const redirect = encodeURIComponent(to.fullPath || '/');
  return `/login?redirect=${redirect}`;
});

router.afterEach(() => {
  NProgress.done();
});
