<template>
  <div class="login">
    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
      <div class="title-box">
        <h3 class="title">{{ title }}</h3>
        <lang-select class="login-language" />
      </div>
      <el-form-item v-if="tenantEnabled" prop="tenantId">
        <el-select v-model="loginForm.tenantId" filterable :placeholder="proxy.$t('login.selectPlaceholder')" style="width: 100%">
          <el-option v-for="item in tenantList" :key="item.tenantId" :label="item.companyName" :value="item.tenantId"></el-option>
          <template #prefix><svg-icon icon-class="company" class="el-input__icon input-icon" /></template>
        </el-select>
      </el-form-item>
      <el-form-item prop="username">
        <el-input v-model="loginForm.username" type="text" size="large" autocomplete="username" :placeholder="proxy.$t('login.username')">
          <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          size="large"
          autocomplete="current-password"
          show-password
          :placeholder="proxy.$t('login.password')"
          @keyup.enter="handleLogin"
        >
          <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="captchaEnabled" prop="code" class="captcha-row">
        <el-input
          v-model="loginForm.code"
          class="captcha-input"
          size="large"
          autocomplete="off"
          :placeholder="proxy.$t('login.code')"
          @keyup.enter="handleLogin"
        >
          <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
        </el-input>
        <div class="login-code">
          <img :src="codeUrl" class="login-code-img" :alt="proxy.$t('login.code')" @click="getCode" />
        </div>
      </el-form-item>
      <div class="login-options">
        <el-checkbox v-model="loginForm.rememberMe">{{ proxy.$t('login.rememberPassword') }}</el-checkbox>
      </div>

      <el-form-item class="login-submit">
        <el-button :loading="loading" size="large" type="primary" style="width: 100%" @click.prevent="handleLogin">
          <span v-if="!loading">{{ proxy.$t('login.login') }}</span>
          <span v-else>{{ proxy.$t('login.logging') }}</span>
        </el-button>
        <div v-if="register" class="register-link">
          <router-link class="link-type" :to="'/register'">{{ proxy.$t('login.switchRegisterPage') }}</router-link>
        </div>
      </el-form-item>
    </el-form>
    <!--  底部  -->
    <div class="el-login-footer">
      <span>Copyright © 2018-2026 All Rights Reserved.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCodeImg, getTenantList } from '@/api/login';
import { authRouterUrl } from '@/api/system/social/auth';
import { useUserStore } from '@/store/modules/user';
import { LoginData, TenantVO } from '@/api/types';
import { to } from 'await-to-js';
import { HttpStatus } from '@/enums/RespEnum';
import { useI18n } from 'vue-i18n';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const title = import.meta.env.VITE_APP_TITLE;
const userStore = useUserStore();
const router = useRouter();
const { t } = useI18n();

// 登录页只负责采集认证表单；租户列表、验证码和登录结果都来自后端认证接口。
const loginForm = ref<LoginData>({
  tenantId: '000000',
  username: 'admin',
  password: 'admin123',
  rememberMe: false,
  code: '',
  uuid: ''
} as LoginData);

const loginRules: ElFormRules = {
  tenantId: [{ required: true, trigger: 'blur', message: t('login.rule.tenantId.required') }],
  username: [{ required: true, trigger: 'blur', message: t('login.rule.username.required') }],
  password: [{ required: true, trigger: 'blur', message: t('login.rule.password.required') }],
  code: [{ required: true, trigger: 'change', message: t('login.rule.code.required') }]
};

const codeUrl = ref('');
const loading = ref(false);
// 验证码开关
const captchaEnabled = ref(true);
// 租户开关
const tenantEnabled = ref(true);

// 注册开关
const register = ref(false);
const redirect = ref('/');
const loginRef = ref<ElFormInstance>();
// 租户列表
const tenantList = ref<TenantVO[]>([]);

watch(
  () => router.currentRoute.value,
  (newRoute: any) => {
    redirect.value = newRoute.query && newRoute.query.redirect && decodeURIComponent(newRoute.query.redirect);
  },
  { immediate: true }
);

const handleLogin = () => {
  loginRef.value?.validate(async (valid: boolean, fields: any) => {
    if (valid) {
      loading.value = true;
      // 勾选了需要记住密码设置在 localStorage 中设置记住用户名和密码
      if (loginForm.value.rememberMe) {
        localStorage.setItem('tenantId', String(loginForm.value.tenantId));
        localStorage.setItem('username', String(loginForm.value.username));
        localStorage.setItem('password', String(loginForm.value.password));
        localStorage.setItem('rememberMe', String(loginForm.value.rememberMe));
      } else {
        // 否则移除
        localStorage.removeItem('tenantId');
        localStorage.removeItem('username');
        localStorage.removeItem('password');
        localStorage.removeItem('rememberMe');
      }
      // 调用action的登录方法
      const [err] = await to(userStore.login(loginForm.value));
      if (!err) {
        const redirectUrl = redirect.value || '/';
        await router.push(redirectUrl);
        loading.value = false;
      } else {
        loading.value = false;
        // 重新获取验证码
        if (captchaEnabled.value) {
          await getCode();
        }
      }
    } else {
      console.log('error submit!', fields);
    }
  });
};

/**
 * 获取验证码
 */
const getCode = async () => {
  const res = await getCodeImg();
  const { data } = res;
  captchaEnabled.value = data.captchaEnabled === undefined ? true : data.captchaEnabled;
  if (captchaEnabled.value) {
    // 刷新验证码时清空输入框
    loginForm.value.code = '';
    codeUrl.value = 'data:image/gif;base64,' + data.img;
    loginForm.value.uuid = data.uuid;
  }
};

const getLoginData = () => {
  const tenantId = localStorage.getItem('tenantId');
  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');
  const rememberMe = localStorage.getItem('rememberMe');
  loginForm.value = {
    tenantId: tenantId === null ? String(loginForm.value.tenantId) : tenantId,
    username: username === null ? String(loginForm.value.username) : username,
    password: password === null ? String(loginForm.value.password) : String(password),
    rememberMe: rememberMe === null ? false : Boolean(rememberMe)
  } as LoginData;
};

/**
 * 获取租户列表
 */
const initTenantList = async () => {
  const { data } = await getTenantList(false);
  tenantEnabled.value = data.tenantEnabled === undefined ? true : data.tenantEnabled;
  if (tenantEnabled.value) {
    tenantList.value = data.voList;
    if (tenantList.value != null && tenantList.value.length !== 0) {
      loginForm.value.tenantId = tenantList.value[0].tenantId;
    }
  }
};

/**
 * 第三方登录
 * @param type
 */
const doSocialLogin = (type: string) => {
  authRouterUrl(type, loginForm.value.tenantId).then((res: any) => {
    if (res.code === HttpStatus.SUCCESS) {
      // 获取授权地址跳转
      window.location.href = res.data;
    } else {
      ElMessage.error(res.msg);
    }
  });
};

onMounted(() => {
  getCode();
  initTenantList();
  getLoginData();
});
</script>

<style lang="scss" scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  height: auto;
  padding: 56px 20px 64px;
  background-image: url('../assets/images/login-background.jpg');
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.title-box {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 26px;

  .title {
    margin: 0;
    text-align: center;
    color: #273849;
    font-size: 22px;
    line-height: 32px;
    font-weight: 700;
    letter-spacing: 0;
  }

  .login-language {
    position: absolute;
    right: 0;
    top: 0;
  }

  .login-language :deep(.lang-select--style) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    line-height: 1;
    color: rgba(39, 56, 73, 0.58);
    border-radius: var(--app-radius-sm);
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
  }

  .login-language :deep(.lang-select--style:hover) {
    color: var(--el-color-primary);
    background: rgba(64, 158, 255, 0.1);
  }
}

.login-form {
  border-radius: var(--app-radius-md);
  background: rgba(244, 251, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.72);
  width: min(420px, 90vw);
  padding: 31px 31px 24px;
  z-index: 1;
  box-shadow: 0 20px 42px rgba(47, 125, 195, 0.13);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  .el-input {
    height: 40px;

    input {
      height: 40px;
    }
  }

  .input-icon {
    height: 40px;
    width: 14px;
    margin-left: 0px;
    color: rgba(39, 56, 73, 0.46);
  }
}

.login-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}

.login-form :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 1px rgba(139, 167, 194, 0.34) inset;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background-color: rgba(255, 255, 255, 0.98);
  box-shadow:
    0 0 0 1px rgba(64, 158, 255, 0.55) inset,
    0 0 0 3px rgba(64, 158, 255, 0.12);
}

.login-form :deep(.el-button--primary) {
  height: 40px;
  border-radius: var(--app-radius-sm);
  font-weight: 600;
  box-shadow: 0 10px 22px rgba(64, 158, 255, 0.26);
}

.login-form :deep(.el-button.is-circle) {
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: var(--el-text-color-regular);
}

.login-form :deep(.el-button.is-circle:hover) {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
}

.captcha-row {
  :deep(.el-form-item__content) {
    display: flex;
    flex-wrap: nowrap;
    gap: 10px;
  }
}

.captcha-input {
  flex: 1 1 auto;
  min-width: 0;
}

.login-code {
  flex: 0 0 122px;
  height: 40px;
  box-sizing: border-box;
  border-radius: var(--app-radius-sm);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(139, 167, 194, 0.34);

  img {
    cursor: pointer;
    vertical-align: middle;
    display: block;
    width: 100%;
    height: 40px;
    object-fit: cover;
  }
}

.login-options {
  display: flex;
  align-items: center;
  min-height: 22px;
  margin: 0 0 25px 0;

  :deep(.el-checkbox) {
    height: 22px;
    color: #409eff;
  }
}

.login-submit {
  margin-bottom: 6px !important;
  width: 100%;
}

.register-link {
  width: 100%;
  margin-top: 12px;
  text-align: right;
}

.el-login-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: rgba(39, 92, 139, 0.66);
  font-family: Arial, serif;
  font-size: 12px;
  letter-spacing: 0;
}

.login-code-img {
  height: 40px;
  padding-left: 0;
}

:global(html.dark) {
  .login {
    background-color: #0f172a;
  }

  .login-form {
    background: rgba(17, 24, 39, 0.9);
    border-color: rgba(148, 163, 184, 0.2);
  }

  .title-box {
    .title {
      color: #e5e7eb;
    }

    :deep(.lang-select--style) {
      color: rgba(226, 232, 240, 0.68);
    }
  }

  .login-form :deep(.el-input__wrapper) {
    background-color: rgba(17, 24, 39, 0.7);
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.24) inset;
  }

  .login-form :deep(.el-input__wrapper.is-focus) {
    box-shadow:
      0 0 0 1px rgba(58, 123, 232, 0.65) inset,
      0 0 0 3px rgba(58, 123, 232, 0.18);
  }

  .login-form .input-icon {
    color: rgba(226, 232, 240, 0.58);
  }

  .login-form :deep(.el-button.is-circle) {
    background: rgba(148, 163, 184, 0.12);
    border-color: rgba(148, 163, 184, 0.25);
    color: #e5e7eb;
  }

  .el-login-footer {
    color: rgba(226, 232, 240, 0.65);
  }
}

@media (max-width: 600px) {
  .login {
    align-items: flex-start;
    padding: 12dvh 16px 72px;
    background-position: center bottom;
  }

  .login-form {
    width: 100%;
    padding: 28px 22px 22px;
  }

  .title-box {
    margin-bottom: 24px;

    .title {
      font-size: 20px;
    }
  }

  .login-code {
    flex-basis: 112px;
  }

  .el-login-footer {
    display: none;
  }
}
</style>
