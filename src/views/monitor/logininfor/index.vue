<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="登录地址" prop="ipaddr">
              <el-input v-model="queryParams.ipaddr" placeholder="请输入登录地址" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="用户名称" prop="userName">
              <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="登录状态" clearable>
                <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="设备类型" prop="deviceType">
              <el-select v-model="queryParams.deviceType" placeholder="全部设备" clearable style="width: 130px">
                <el-option v-for="dict in sys_device_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="部门" prop="deptId">
              <el-tree-select
                v-model="queryParams.deptId"
                :data="deptOptions"
                :props="{ label: 'label', children: 'children', value: 'id' }"
                check-strictly
                clearable
                filterable
                placeholder="全部部门"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="登录时间" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
              ></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['monitor:logininfor:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['monitor:logininfor:remove']" type="danger" plain icon="Delete" @click="handleClean">清空</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['monitor:logininfor:unlock']" type="primary" plain icon="Unlock" :disabled="single" @click="handleUnlock">
              解锁
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['monitor:logininfor:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table
        ref="loginInfoTableRef"
        v-loading="loading"
        :data="loginInfoList"
        :default-sort="defaultSort"
        border
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="访问编号" align="center" prop="infoId" />
        <el-table-column
          label="用户名称"
          align="center"
          prop="userName"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column label="客户端" align="center" prop="clientKey" :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ formatClientKey(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="设备类型" align="center">
          <template #default="scope">
            <span>{{ formatDeviceType(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="地址" align="center" prop="ipaddr" :show-overflow-tooltip="true" />
        <el-table-column label="登录地点" align="center" prop="loginLocation" :show-overflow-tooltip="true" />
        <el-table-column label="操作系统" align="center" prop="os" :show-overflow-tooltip="true" />
        <el-table-column label="浏览器" align="center" prop="browser" :show-overflow-tooltip="true" />
        <el-table-column label="登录状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="sys_common_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="描述" align="center" prop="msg" :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ formatLoginMsg(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="访问时间" align="center" prop="loginTime" sortable="custom" :sort-orders="['descending', 'ascending']" width="180">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.loginTime) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="Logininfor" lang="ts">
import { list, delLoginInfo, cleanLoginInfo, unlockLoginInfo } from '@/api/monitor/loginInfo';
import { LoginInfoQuery, LoginInfoVO } from '@/api/monitor/loginInfo/types';
import { deptTreeSelect } from '@/api/system/user';
import type { DeptTreeVO } from '@/api/system/dept/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_device_type } = toRefs<any>(proxy?.useDict('sys_device_type'));
const { sys_common_status } = toRefs<any>(proxy?.useDict('sys_common_status'));

const loginInfoList = ref<LoginInfoVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const selectName = ref<Array<string>>([]);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const defaultSort = ref<any>({ prop: 'loginTime', order: 'descending' });
const deptOptions = ref<DeptTreeVO[]>([]);

const queryFormRef = ref<ElFormInstance>();
const loginInfoTableRef = ref<ElTableInstance>();
// 查询参数
const queryParams = ref<LoginInfoQuery>({
  pageNum: 1,
  pageSize: 10,
  ipaddr: '',
  userName: '',
  deviceType: '',
  deptId: undefined,
  status: '',
  orderByColumn: defaultSort.value.prop,
  isAsc: defaultSort.value.order
});

const normalizeText = (value?: string | number | null) => String(value ?? '').trim();

const joinRowText = (row: LoginInfoVO) =>
  [row.clientKey, row.deviceType, row.browser, row.os, row.msg].map((item) => normalizeText(item)).join(' ').toLowerCase();

const isSuccessStatus = (row: LoginInfoVO) => normalizeText(row.status) === '0';

const isMiniProgramLog = (row: LoginInfoVO) => {
  const clientKey = normalizeText(row.clientKey);
  const lowerClientKey = clientKey.toLowerCase();
  const rowText = joinRowText(row);
  return (
    clientKey === '小程序' ||
    normalizeText(row.msg).includes('C端登录') ||
    lowerClientKey === 'xcx' ||
    rowText.includes('micromessenger') ||
    rowText.includes('miniprogram') ||
    rowText.includes('wechat')
  );
};

const isMobileLog = (row: LoginInfoVO) => {
  const rowText = joinRowText(row);
  return ['android', 'ios', 'iphone', 'ipad', 'mobile', 'micromessenger', 'miniprogram'].some((keyword) => rowText.includes(keyword));
};

const getDeviceDictLabel = (value: string) => {
  const option = (sys_device_type.value || []).find((item: any) => normalizeText(item.value).toLowerCase() === value.toLowerCase());
  return option?.label || value;
};

const formatClientKey = (row: LoginInfoVO) => {
  const clientKey = normalizeText(row.clientKey);
  const lowerClientKey = clientKey.toLowerCase();
  if (lowerClientKey === 'company' || clientKey === 'B端') {
    return 'B端';
  }
  if (isMiniProgramLog(row)) {
    return '小程序';
  }
  if (!clientKey) {
    return 'B端';
  }
  if (lowerClientKey === 'pc') {
    return 'PC';
  }
  if (lowerClientKey === 'app') {
    return 'APP';
  }
  return clientKey;
};

const formatDeviceType = (row: LoginInfoVO) => {
  if (isMiniProgramLog(row)) {
    return '手机';
  }
  const deviceType = normalizeText(row.deviceType);
  const lowerDeviceType = deviceType.toLowerCase();
  if (!deviceType) {
    return isMobileLog(row) ? '手机' : 'PC';
  }
  if (lowerDeviceType === 'pc') {
    return 'PC';
  }
  if (lowerDeviceType === 'xcx' || lowerDeviceType === 'mobile' || lowerDeviceType === 'phone') {
    return '手机';
  }
  return getDeviceDictLabel(deviceType);
};

const formatLoginMsg = (row: LoginInfoVO) => {
  if (isMiniProgramLog(row) && isSuccessStatus(row)) {
    return 'C端登录';
  }
  return normalizeText(row.msg) || '-';
};

const getDeptTree = async () => {
  const res = await deptTreeSelect();
  deptOptions.value = res.data || [];
};

/** 查询登录日志列表 */
const getList = async () => {
  loading.value = true;
  const res = await list(proxy?.addDateRange(queryParams.value, dateRange.value));
  loginInfoList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  queryParams.value.pageNum = 1;
  loginInfoTableRef.value?.sort(defaultSort.value.prop, defaultSort.value.order);
};
/** 多选框选中数据 */
const handleSelectionChange = (selection: LoginInfoVO[]) => {
  ids.value = selection.map((item) => item.infoId);
  multiple.value = !selection.length;
  single.value = selection.length != 1;
  selectName.value = selection.map((item) => item.userName);
};
/** 排序触发事件 */
const handleSortChange = (column: any) => {
  queryParams.value.orderByColumn = column.prop;
  queryParams.value.isAsc = column.order;
  getList();
};
/** 删除按钮操作 */
const handleDelete = async (row?: LoginInfoVO) => {
  const infoIds = row?.infoId || ids.value;
  await proxy?.$modal.confirm('是否确认删除访问编号为"' + infoIds + '"的数据项?');
  await delLoginInfo(infoIds);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};
/** 清空按钮操作 */
const handleClean = async () => {
  await proxy?.$modal.confirm('是否确认清空所有登录日志数据项?');
  await cleanLoginInfo();
  await getList();
  proxy?.$modal.msgSuccess('清空成功');
};
/** 解锁按钮操作 */
const handleUnlock = async () => {
  const username = selectName.value;
  await proxy?.$modal.confirm('是否确认解锁用户"' + username + '"数据项?');
  await unlockLoginInfo(username);
  proxy?.$modal.msgSuccess('用户' + username + '解锁成功');
};
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'monitor/logininfor/export',
    {
      ...queryParams.value
    },
    `logininfor_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getDeptTree();
  getList();
});
</script>
