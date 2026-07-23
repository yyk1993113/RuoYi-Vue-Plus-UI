import { defineConfig, loadEnv } from 'vite';
import createPlugins from './vite/plugins';
import autoprefixer from 'autoprefixer'; // css自动添加兼容性前缀
import path from 'path';

const chunkGroups: Array<{ name: string; tests: string[] }> = [
  {
    name: 'vendor-framework',
    tests: ['/vue/', '/vue-router/', '/pinia/', '/@vueuse/core/', '/vue-i18n/', '/element-plus/', '/@element-plus/icons-vue/']
  },
  { name: 'vendor-charts', tests: ['/echarts/'] },
  { name: 'vendor-excel', tests: ['/xlsx/', '/file-saver/'] },
  { name: 'vendor-editor', tests: ['/quill/', '/@vueup/vue-quill/', '/highlight.js/'] },
  { name: 'vendor-crypto', tests: ['/crypto-js/', '/jsencrypt/'] }
];

function manualChunks(id: string) {
  if (!id.includes('node_modules')) return;
  const normalizedId = id.replaceAll('\\', '/');
  const matchedGroup = chunkGroups.find((group) => group.tests.some((test) => normalizedId.includes(test)));
  // Only pin known large libraries; let Rollup place the remaining dependencies to avoid circular manual chunks.
  return matchedGroup?.name;
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());
  // 开发代理目标由 .env.development 注入，默认走本机 ruoyi-gateway。
  const backendProxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8088';
  return {
    // 部署生产环境和开发环境下的URL。
    // 默认情况下，vite 会假设你的应用是被部署在一个域名的根路径上
    // 例如 https://www.ruoyi.vip/。如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。例如，如果你的应用被部署在 https://www.ruoyi.vip/admin/，则设置 baseUrl 为 /admin/。
    base: env.VITE_APP_CONTEXT_PATH,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    // https://cn.vitejs.dev/config/#resolve-extensions
    plugins: createPlugins(env, command === 'build'),
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_APP_PORT),
      open: true,
      proxy: {
        [env.VITE_APP_BASE_API]: {
          target: backendProxyTarget,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp('^' + env.VITE_APP_BASE_API), '')
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          // additionalData: '@use "@/assets/styles/variables.module.scss as *";'
          // javascriptEnabled: true
        }
      },
      postcss: {
        plugins: [
          // 浏览器兼容性
          autoprefixer(),
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule) => {
                atRule.remove();
              }
            }
          }
        ]
      }
    },
    build: {
      // 手动拆分大依赖，避免 Rollup 在单个巨型 vendor chunk 上出现高内存峰值。
      rollupOptions: {
        output: {
          manualChunks
        }
      },
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1400
    },
    // 预编译
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'axios',
        '@vueuse/core',
        'echarts',
        'vue-i18n',
        '@vueup/vue-quill',
        'image-conversion',
        'element-plus/es/components/**/css'
      ]
    }
  };
});
