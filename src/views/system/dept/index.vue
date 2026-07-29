<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="部门名称" prop="deptName">
              <el-input v-model="queryParams.deptName" placeholder="请输入部门名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item v-if="activeOrgScope === 'internal'" label="类别编码" prop="deptCategory">
              <el-input v-model="queryParams.deptCategory" placeholder="请输入类别编码" clearable style="width: 240px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item v-if="activeOrgScope === 'internal'" label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="部门状态" clearable>
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-else label="认证状态" prop="certStatus">
              <el-select v-model="queryParams.certStatus" placeholder="认证状态" clearable>
                <el-option label="未认证" value="not_submitted" />
                <el-option label="待审核" value="0" />
                <el-option label="已认证" value="1" />
                <el-option label="已拒绝" value="2" />
              </el-select>
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
      <el-tabs v-model="activeOrgScope" class="org-scope-tabs" @tab-change="handleOrgScopeChange">
        <el-tab-pane label="内部部门" name="internal" />
        <el-tab-pane label="B端企业" name="company" />
      </el-tabs>
      <template #header>
        <el-row :gutter="10">
          <el-col v-if="activeOrgScope === 'internal'" :span="1.5">
            <el-button v-hasPermi="['system:dept:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增 </el-button>
          </el-col>
          <el-col v-if="activeOrgScope === 'company'" :span="1.5">
            <el-button
              v-hasPermi="['system:dept:add']"
              v-hasRole="['superadmin', 'operator', 'auditor']"
              type="success"
              plain
              icon="OfficeBuilding"
              @click="openEnterpriseEntryDialog"
            >
              录入企业
            </el-button>
          </el-col>
          <el-col v-if="activeOrgScope === 'company'" :span="1.5">
            <el-button
              v-hasPermi="['system:dept:add']"
              v-hasRole="['superadmin', 'operator', 'auditor']"
              type="warning"
              plain
              icon="Download"
              @click="openEnterpriseImportDialog"
            >
              导入已有企业
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="info" plain icon="Sort" @click="handleToggleExpandAll">展开/折叠</el-button>
          </el-col>
          <el-col v-if="activeOrgScope === 'company'" :span="1.5">
            <el-button v-hasPermi="['system:dept:add']" type="success" plain icon="Connection" @click="openOrgTemplateDialog">B端组织模板</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table
        ref="deptTableRef"
        v-loading="loading"
        :data="deptList"
        row-key="deptId"
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="isExpandAll"
        :row-class-name="deptRowClassName"
      >
        <el-table-column prop="deptName" label="部门名称" min-width="280">
          <template #default="scope">
            <div class="dept-name-cell">
              <el-icon :class="isCompanyRoot(scope.row) ? 'company-node-icon' : 'internal-node-icon'">
                <OfficeBuilding v-if="isCompanyRoot(scope.row)" />
                <HomeFilled v-else />
              </el-icon>
              <span>{{ scope.row.deptName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="组织归属" align="center" width="130">
          <template #default="scope">
            <el-tag v-if="isCompanyRoot(scope.row)" size="small" type="success" effect="light">B端企业</el-tag>
            <el-tag v-else size="small" type="primary" effect="plain">内部组织</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deptCategory" align="center" label="类别编码" width="200">
          <template #default="scope">
            <el-tag v-if="isCompanyRoot(scope.row)" size="small" type="success" effect="plain">company</el-tag>
            <span v-else>{{ scope.row.deptCategory || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" align="center" label="排序" width="200"></el-table-column>
        <el-table-column prop="status" align="center" :label="activeOrgScope === 'company' ? '认证状态' : '状态'" width="110">
          <template #default="scope">
            <el-tag v-if="activeOrgScope === 'company'" :type="companyCertStatusMeta(scope.row.certStatus).type">
              {{ companyCertStatusMeta(scope.row.certStatus).label }}
            </el-tag>
            <dict-tag v-else :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="200">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" label="操作">
          <template #default="scope">
            <template v-if="!isCompanyRoot(scope.row)">
              <el-tooltip content="修改" placement="top">
                <el-button v-hasPermi="['system:dept:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
              </el-tooltip>
              <el-tooltip content="新增" placement="top">
                <el-button v-hasPermi="['system:dept:add']" link type="primary" icon="Plus" @click="handleAdd(scope.row)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button v-hasPermi="['system:dept:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)" />
              </el-tooltip>
            </template>
            <el-tooltip v-else :content="scope.row.companyId ? '查看企业完整资料' : '该历史企业节点尚未关联企业主体'" placement="top">
              <el-button link type="primary" icon="View" :disabled="!scope.row.companyId" @click="handleCompanyDetail(scope.row)">查看详情</el-button>
            </el-tooltip>
            <el-tooltip v-if="isCompanyRoot(scope.row)" content="将企业部门和可登录人员同步到 OA" placement="top">
              <el-button
                v-hasPermi="['system:dept:add']"
                v-hasRole="['superadmin', 'operations_manager', 'operator']"
                link
                type="success"
                icon="Connection"
                :loading="isCompanySyncing(scope.row)"
                :disabled="!scope.row.companyId"
                @click="handleSyncCompanyToOa(scope.row)"
              >
                同步OA
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" destroy-on-close append-to-body width="600px">
      <el-form ref="deptFormRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col v-if="form.parentId !== 0" :span="24">
            <el-form-item label="上级部门" prop="parentId">
              <el-tree-select
                v-model="form.parentId"
                :data="deptOptions"
                :props="{ value: 'deptId', label: 'deptName', children: 'children' } as any"
                value-key="deptId"
                placeholder="选择上级部门"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门名称" prop="deptName">
              <el-input v-model="form.deptName" placeholder="请输入部门名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类别编码" prop="deptCategory">
              <el-input v-model="form.deptCategory" placeholder="请输入类别编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="leader">
              <el-select v-model="form.leader" placeholder="请选择负责人">
                <el-option v-for="item in deptUserList" :key="item.userId" :label="item.userName" :value="item.userId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="companyDetailDialog.visible" title="企业详情" width="820px" append-to-body destroy-on-close>
      <div v-loading="companyDetailLoading">
        <el-descriptions v-if="companyDetail" :column="2" border>
          <el-descriptions-item label="企业编码">{{ companyDetail.companyNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="认证状态">
            <el-tag :type="companyDetailStatus.type">{{ companyDetailStatus.label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="企业名称" :span="2">{{ companyDetail.companyName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="统一社会信用代码">{{ companyDetail.socialCreditCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="法定代表人">{{ companyDetail.legalPersonName || companyDetail.contactPerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="法人手机号">{{ companyDetail.legalPersonPhone || companyDetail.contactPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="超管手机号">{{ companyDetail.adminPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ companyDetail.contactPerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ companyDetail.contactPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="注册地址" :span="2">{{ companyDetail.registeredAddress || '-' }}</el-descriptions-item>
          <el-descriptions-item label="办公地址" :span="2">{{ companyDetail.companyAddress || '-' }}</el-descriptions-item>
          <el-descriptions-item label="企业简介" :span="2">{{ companyDetail.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ companyDetail.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ companyDetail.updateTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注/审核意见" :span="2">{{ companyDetail.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="companyDetailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="orgTemplateDialog.visible" title="B端企业组织架构初始化模板" append-to-body width="760px">
      <el-alert
        title="模板仅作为企业初始化组织架构参考；点击节点后会打开原有新增部门弹窗，仍需选择上级部门并手动确认保存。"
        type="info"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <el-tabs v-model="activeOrgTemplateKey">
        <el-tab-pane v-for="template in orgTemplates" :key="template.key" :label="template.name" :name="template.key">
          <div class="org-template-layout">
            <div class="org-template-desc">
              <div class="org-template-title">{{ template.name }}</div>
              <div class="org-template-text">{{ template.desc }}</div>
            </div>
            <el-tree
              :data="template.nodes"
              node-key="id"
              default-expand-all
              :props="{ label: 'deptName', children: 'children' }"
              @node-click="handleOrgTemplateNodeClick"
            >
              <template #default="{ data }">
                <span class="org-template-node">
                  <span>{{ data.deptName }}</span>
                  <el-tag size="small" effect="plain">{{ data.deptCategory }}</el-tag>
                </span>
              </template>
            </el-tree>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :disabled="!selectedOrgTemplateNode" @click="handleAddFromOrgTemplate">按选中节点新增</el-button>
          <el-button @click="handleCustomOrgBuild">自定义搭建</el-button>
          <el-button @click="orgTemplateDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="enterpriseEntryDialog.visible"
      title="录入企业并带入部门"
      append-to-body
      width="820px"
      top="5vh"
      class="enterprise-entry-dialog"
      destroy-on-close
    >
      <el-alert
        title="该入口会按企业管理新增规则创建真实企业并提交审核，同时生成企业根节点；企业审核、员工、岗位等仍在原业务入口维护。"
        type="info"
        :closable="false"
        show-icon
        class="mb-4"
      />
      <el-form ref="enterpriseEntryFormRef" :model="enterpriseEntryForm" :rules="enterpriseEntryRules" label-width="120px" scroll-to-error>
        <div class="enterprise-form-section">企业主体</div>
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="公司全称" prop="companyName">
              <el-input v-model="enterpriseEntryForm.companyName" maxlength="20" placeholder="与营业执照一致" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信用代码" prop="socialCreditCode">
              <el-input v-model="enterpriseEntryForm.socialCreditCode" maxlength="18" placeholder="18位统一社会信用代码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人姓名" prop="contactPerson">
              <el-input v-model="enterpriseEntryForm.contactPerson" maxlength="10" placeholder="法定代表人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人电话" prop="contactPhone">
              <el-input
                v-model="enterpriseEntryForm.contactPhone"
                maxlength="11"
                placeholder="11位手机号"
                @input="normalizeEnterprisePhone('contactPhone')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="超管手机号" prop="adminPhone">
              <el-input
                v-model="enterpriseEntryForm.adminPhone"
                maxlength="11"
                placeholder="选填，空则使用法人电话"
                @input="normalizeEnterprisePhone('adminPhone')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="注册地址" prop="registeredAddress">
              <el-input v-model="enterpriseEntryForm.registeredAddress" type="textarea" :rows="2" maxlength="150" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="办公地址" prop="companyAddress">
              <el-input v-model="enterpriseEntryForm.companyAddress" type="textarea" :rows="2" maxlength="150" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="enterprise-form-section">资质材料（选填）</div>
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="营业执照">
              <image-upload v-model="enterpriseEntryForm.businessLicense" :limit="1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人身份证">
              <image-upload v-model="enterpriseEntryForm.idCardPhotoIds" :limit="2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="对公账户凭证">
              <image-upload v-model="enterpriseEntryForm.bankAccountIds" :limit="1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="办公场地实景">
              <image-upload v-model="enterpriseEntryForm.companyAddressIds" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企业Logo">
              <image-upload v-model="enterpriseEntryForm.logoUrl" :limit="1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="招聘授权书">
              <file-upload
                v-model="enterpriseEntryForm.recruitmentAuthorizationIds"
                :limit="1"
                :file-size="10"
                :file-type="['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'webp', 'gif']"
                upload-url="/api/company/upload"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="enterpriseEntrySubmitting" @click="submitEnterpriseEntry">录入并提交审核</el-button>
          <el-button :disabled="enterpriseEntrySubmitting" @click="enterpriseEntryDialog.visible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="enterpriseImportDialog.visible" title="从企业管理导入" append-to-body width="920px" destroy-on-close>
      <div class="enterprise-import-head">
        <div>
          <div class="enterprise-import-title">选择已有企业</div>
          <div class="enterprise-import-desc">只生成或绑定企业根节点，不修改企业状态、账号、认证和招聘数据。</div>
        </div>
        <el-tag type="success" effect="plain">已带入 {{ importedCompanyIds.size }} 家</el-tag>
      </div>
      <el-form :model="enterpriseImportQuery" inline class="enterprise-import-query">
        <el-form-item label="企业名称">
          <el-input v-model="enterpriseImportQuery.companyName" clearable placeholder="输入企业名称" @keyup.enter="queryEnterpriseCandidates" />
        </el-form-item>
        <el-form-item label="企业编号">
          <el-input v-model="enterpriseImportQuery.companyNo" clearable placeholder="输入企业编号" @keyup.enter="queryEnterpriseCandidates" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="enterpriseImportQuery.status" clearable placeholder="全部状态" style="width: 140px">
            <el-option label="待审核" value="0" />
            <el-option label="已认证" value="1" />
            <el-option label="已禁用" value="2" />
            <el-option label="草稿" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="queryEnterpriseCandidates">查询</el-button>
          <el-button icon="Refresh" @click="resetEnterpriseImportQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table
        ref="enterpriseImportTableRef"
        v-loading="enterpriseImportLoading"
        :data="enterpriseCandidates"
        row-key="companyId"
        border
        height="360"
        @selection-change="handleEnterpriseSelectionChange"
      >
        <el-table-column type="selection" width="48" :selectable="isEnterpriseSelectable" reserve-selection />
        <el-table-column prop="companyNo" label="企业编号" width="150">
          <template #default="scope">{{ scope.row.companyNo || '-' }}</template>
        </el-table-column>
        <el-table-column prop="companyName" label="企业名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="contactPerson" label="法人/联系人" width="130">
          <template #default="scope">{{ scope.row.contactPerson || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="企业状态" width="110" align="center">
          <template #default="scope">
            <el-tag size="small" :type="enterpriseStatusMeta(scope.row.status).type">{{ enterpriseStatusMeta(scope.row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="部门状态" width="110" align="center">
          <template #default="scope">
            <el-tag v-if="isEnterpriseImported(scope.row)" type="success" size="small" effect="plain">已带入</el-tag>
            <el-tag v-else type="info" size="small" effect="plain">未带入</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="enterprise-import-pagination">
        <el-pagination
          v-model:current-page="enterpriseImportQuery.pageNum"
          v-model:page-size="enterpriseImportQuery.pageSize"
          layout="total, sizes, prev, pager, next"
          :total="enterpriseImportTotal"
          :page-sizes="[10, 20, 50]"
          @current-change="loadEnterpriseCandidates"
          @size-change="handleEnterpriseImportSizeChange"
        />
      </div>
      <template #footer>
        <div class="enterprise-import-footer">
          <span>已选择 {{ selectedEnterpriseIds.length }} 家，单次最多100家</span>
          <div>
            <el-button
              type="primary"
              :loading="enterpriseImportSubmitting"
              :disabled="selectedEnterpriseIds.length === 0"
              @click="submitEnterpriseImport"
            >
              确认导入
            </el-button>
            <el-button :disabled="enterpriseImportSubmitting" @click="enterpriseImportDialog.visible = false">取消</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Dept" lang="ts">
import { HomeFilled, OfficeBuilding } from '@element-plus/icons-vue';
import {
  listDept,
  getDept,
  delDept,
  addDept,
  updateDept,
  listDeptExcludeChild,
  importCompanyDepartments,
  entryCompanyDepartment,
  syncCompanyOrganizationToOa
} from '@/api/system/dept';
import { DeptForm, DeptQuery, DeptVO } from '@/api/system/dept/types';
import { UserVO } from '@/api/system/user/types';
import { listUserByDeptId } from '@/api/system/user';
import { CompanyQuery, CompanyVO, getCompany, getCompanyAuditHistory, listCompany } from '@/api/recruitment';

interface DeptOptionsType {
  deptId: number | string;
  deptName: string;
  children: DeptOptionsType[];
}

interface OrgTemplateNode {
  id: string;
  deptName: string;
  deptCategory: string;
  orderNum: number;
  children?: OrgTemplateNode[];
}

type EnterprisePhoneField = 'contactPhone' | 'adminPhone';

interface CompanyDepartmentImportResult {
  importedCount: number;
  linkedCount: number;
  skippedCount: number;
  skippedItems?: string[];
}

interface EnterpriseEntryForm {
  companyName: string;
  socialCreditCode: string;
  contactPerson: string;
  contactPhone: string;
  adminPhone: string;
  registeredAddress: string;
  companyAddress: string;
  businessLicense: string;
  idCardPhotoIds: string;
  bankAccountIds: string;
  companyAddressIds: string;
  recruitmentAuthorizationIds: string;
  logoUrl: string;
  status?: string;
}

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'));

const deptList = ref<DeptVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const deptOptions = ref<DeptOptionsType[]>([]);
const isExpandAll = ref(true);
const deptUserList = ref<UserVO[]>([]);
const activeOrgTemplateKey = ref('standard');
const selectedOrgTemplateNode = ref<OrgTemplateNode>();
const importedCompanyIds = ref<Set<string>>(new Set());
const enterpriseEntryFormRef = ref<ElFormInstance>();
const enterpriseImportTableRef = ref<ElTableInstance>();
const enterpriseEntrySubmitting = ref(false);
const enterpriseImportLoading = ref(false);
const enterpriseImportSubmitting = ref(false);
const enterpriseCandidates = ref<CompanyVO[]>([]);
const enterpriseImportTotal = ref(0);
const selectedEnterpriseIds = ref<Array<number | string>>([]);
const activeOrgScope = ref<'internal' | 'company'>('internal');
const companyDetailLoading = ref(false);
const syncingCompanyIds = ref<Set<string>>(new Set());
const companyDetail = ref<Record<string, any>>();
const companyCertStatus = ref('not_submitted');

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const orgTemplateDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const enterpriseEntryDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const enterpriseImportDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const companyDetailDialog = reactive<DialogOption>({
  visible: false,
  title: '企业详情'
});

const createEmptyEnterpriseEntryForm = (): EnterpriseEntryForm => ({
  companyName: '',
  socialCreditCode: '',
  contactPerson: '',
  contactPhone: '',
  adminPhone: '',
  registeredAddress: '',
  companyAddress: '',
  businessLicense: '',
  idCardPhotoIds: '',
  bankAccountIds: '',
  companyAddressIds: '',
  recruitmentAuthorizationIds: '',
  logoUrl: ''
});

const enterpriseEntryForm = ref<EnterpriseEntryForm>(createEmptyEnterpriseEntryForm());
const enterpriseImportQuery = reactive<CompanyQuery>({
  pageNum: 1,
  pageSize: 10,
  companyName: '',
  companyNo: '',
  status: '',
  deleted: '0'
});

// 录入企业的必填与格式口径保持和“企业管理-新增”一致，独立弹窗不改变原页面表单。
const enterpriseEntryRules = reactive({
  companyName: [{ required: true, message: '请输入公司全称', trigger: 'blur' }],
  socialCreditCode: [
    { required: true, message: '请输入信用代码', trigger: 'blur' },
    { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: '请输入正确的18位统一社会信用代码', trigger: 'blur' }
  ],
  contactPerson: [{ required: true, message: '请输入法人姓名', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入法定代表人电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  registeredAddress: [{ required: true, message: '请输入注册地址', trigger: 'blur' }],
  adminPhone: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (!value || /^1[3-9]\d{9}$/.test(value)) callback();
        else callback(new Error('请输入正确的11位手机号'));
      },
      trigger: 'blur'
    }
  ]
});

const orgTemplates: Array<{ key: string; name: string; desc: string; nodes: OrgTemplateNode[] }> = [
  {
    key: 'standard',
    name: '标准企业模板',
    desc: '适合多数中小企业：总经办、人事行政、招聘、财务、业务部门分层清晰，方便快速初始化。',
    nodes: [
      {
        id: 'standard-root',
        deptName: '企业总部',
        deptCategory: 'company',
        orderNum: 1,
        children: [
          { id: 'standard-office', deptName: '总经办', deptCategory: 'company_office', orderNum: 1 },
          { id: 'standard-hr', deptName: '人事行政部', deptCategory: 'company_hr_admin', orderNum: 2 },
          { id: 'standard-recruit', deptName: '招聘部', deptCategory: 'company_recruit', orderNum: 3 },
          { id: 'standard-finance', deptName: '财务部', deptCategory: 'company_finance', orderNum: 4 },
          { id: 'standard-business', deptName: '业务部', deptCategory: 'company_business', orderNum: 5 }
        ]
      }
    ]
  },
  {
    key: 'recruitment',
    name: '招聘型企业模板',
    desc: '适合招聘需求较重的企业：突出招聘管理、候选人运营、面试协同和用工交付。',
    nodes: [
      {
        id: 'recruitment-root',
        deptName: '招聘中心',
        deptCategory: 'company_recruit_center',
        orderNum: 1,
        children: [
          { id: 'recruitment-manager', deptName: '招聘管理组', deptCategory: 'company_recruit_manager', orderNum: 1 },
          { id: 'recruitment-specialist', deptName: '招聘专员组', deptCategory: 'company_recruit_specialist', orderNum: 2 },
          { id: 'recruitment-interview', deptName: '面试协同组', deptCategory: 'company_interview', orderNum: 3 },
          { id: 'recruitment-delivery', deptName: '入职交付组', deptCategory: 'company_delivery', orderNum: 4 }
        ]
      }
    ]
  },
  {
    key: 'simple',
    name: '小微企业模板',
    desc: '适合组织较轻的小微企业：保留核心管理、招聘、人事财务三个基础单元。',
    nodes: [
      {
        id: 'simple-root',
        deptName: '企业组织',
        deptCategory: 'company',
        orderNum: 1,
        children: [
          { id: 'simple-management', deptName: '管理组', deptCategory: 'company_management', orderNum: 1 },
          { id: 'simple-recruit', deptName: '招聘组', deptCategory: 'company_recruit', orderNum: 2 },
          { id: 'simple-admin', deptName: '人事财务组', deptCategory: 'company_admin_finance', orderNum: 3 }
        ]
      }
    ]
  }
];

const deptTableRef = ref<ElTableInstance>();
const queryFormRef = ref<ElFormInstance>();
const deptFormRef = ref<ElFormInstance>();

const initFormData: DeptForm = {
  deptId: undefined,
  parentId: undefined,
  deptName: undefined,
  deptCategory: undefined,
  orderNum: 0,
  leader: undefined,
  phone: undefined,
  email: undefined,
  status: '0'
};
const initData: PageData<DeptForm, DeptQuery> = {
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptName: undefined,
    deptCategory: undefined,
    orgScope: 'internal',
    certStatus: undefined,
    status: undefined
  },
  rules: {
    parentId: [{ required: true, message: '上级部门不能为空', trigger: 'blur' }],
    deptName: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
    orderNum: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
    email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
    phone: [{ pattern: /^1[3456789][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }]
  }
};
const data = reactive<PageData<DeptForm, DeptQuery>>(initData);

const { queryParams, form, rules } = toRefs<PageData<DeptForm, DeptQuery>>(data);

const syncImportedCompanyIds = (rows: DeptVO[]) => {
  importedCompanyIds.value = new Set(
    rows.filter((item) => item.companyId !== null && item.companyId !== undefined).map((item) => String(item.companyId))
  );
};

const loadImportedCompanyIds = async () => {
  const response = await listDept();
  syncImportedCompanyIds(response.data || []);
};

/** 查询菜单列表 */
const getList = async () => {
  loading.value = true;
  queryParams.value.orgScope = activeOrgScope.value;
  const res = await listDept(queryParams.value);
  const scopedRows = filterRowsByOrgScope(res.data || [], activeOrgScope.value);
  // 搜索结果可能只含部分企业；仅在未筛选时刷新完整“已带入”集合。
  if (!queryParams.value.deptName && !queryParams.value.deptCategory && !queryParams.value.status && !queryParams.value.certStatus) {
    syncImportedCompanyIds(scopedRows);
  }
  const data = proxy?.handleTree<DeptVO>(scopedRows, 'deptId');
  if (data) {
    deptList.value = data;
  }
  loading.value = false;
};

/** 查询当前部门的所有用户 */
async function getDeptAllUser(deptId: any) {
  if (deptId !== null && deptId !== '' && deptId !== undefined) {
    const res = await listUserByDeptId(deptId);
    deptUserList.value = res.data;
  }
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};
/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  deptFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  getList();
};
/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 展开/折叠操作 */
const handleToggleExpandAll = () => {
  isExpandAll.value = !isExpandAll.value;
  toggleExpandAll(deptList.value, isExpandAll.value);
};

// 页签切换由后端按稳定 companyId/历史 company 类别分流，避免全量组织树在浏览器端混排。
const handleOrgScopeChange = async () => {
  queryParams.value.orgScope = activeOrgScope.value;
  queryParams.value.deptCategory = undefined;
  queryParams.value.status = undefined;
  queryParams.value.certStatus = undefined;
  await getList();
};

const isCompanyRoot = (row?: DeptVO) =>
  !!row &&
  ((row.companyId !== null && row.companyId !== undefined) ||
    String(row.deptCategory || '')
      .toLowerCase()
      .startsWith('company'));

// 兼容历史 company_* 分类；内部页签在渲染前再次剔除企业分支，避免旧数据混入。
const filterRowsByOrgScope = (rows: DeptVO[], scope: 'internal' | 'company') => {
  const companyNodeIds = new Set(rows.filter(isCompanyRoot).map((row) => String(row.deptId)));
  const belongsToCompany = (row: DeptVO) => {
    if (isCompanyRoot(row)) return true;
    return String(row.ancestors || '')
      .split(',')
      .some((ancestorId) => companyNodeIds.has(ancestorId.trim()));
  };
  return rows.filter((row) => (scope === 'company' ? belongsToCompany(row) : !belongsToCompany(row)));
};

// 列表只做视觉分区：企业数据判断仍以稳定的 companyId/既有 company 类别为准。
const deptRowClassName = ({ row }: { row: DeptVO }) => (isCompanyRoot(row) ? 'b-company-row' : 'internal-org-row');

const companyCertStatusMeta = (status?: DeptVO['certStatus']) => {
  const statusMap = {
    not_submitted: { label: '未认证', type: 'info' as const },
    '0': { label: '待审核', type: 'warning' as const },
    '1': { label: '已认证', type: 'success' as const },
    '2': { label: '已拒绝', type: 'danger' as const }
  };
  return statusMap[status || 'not_submitted'];
};

const companyDetailStatus = computed(() => {
  const statusMap: Record<string, { label: string; type: 'success' | 'warning' | 'danger' | 'info' }> = {
    not_submitted: { label: '未认证', type: 'info' },
    '0': { label: '待审核', type: 'warning' },
    '1': { label: '已认证', type: 'success' },
    '2': { label: '已拒绝', type: 'danger' }
  };
  return statusMap[companyCertStatus.value] || { label: '未知', type: 'info' as const };
});

// 部门页直接按 companyId 拉取只读详情，避免跳离当前组织管理上下文。
const handleCompanyDetail = async (row: DeptVO) => {
  if (row.companyId === null || row.companyId === undefined) return;
  companyDetail.value = undefined;
  companyCertStatus.value = 'not_submitted';
  companyDetailDialog.visible = true;
  companyDetailLoading.value = true;
  try {
    const response = await getCompany(row.companyId);
    companyDetail.value = response.data || {};
    try {
      const historyResponse = await getCompanyAuditHistory(row.companyId);
      const certHistory = historyResponse.data?.certHistory;
      companyCertStatus.value =
        Array.isArray(certHistory) && certHistory.length > 0 ? String(certHistory[0]?.status ?? 'not_submitted') : 'not_submitted';
    } catch {
      companyCertStatus.value = 'not_submitted';
    }
  } catch {
    companyDetailDialog.visible = false;
    proxy?.$modal.msgError('获取企业详情失败');
  } finally {
    companyDetailLoading.value = false;
  }
};

const isCompanySyncing = (row: DeptVO) => row.companyId !== null && row.companyId !== undefined && syncingCompanyIds.value.has(String(row.companyId));

// 管理页只触发一次后端同步；OA 地址、签名和密码摘要均由两端服务处理，不暴露给浏览器。
const handleSyncCompanyToOa = async (row: DeptVO) => {
  if (row.companyId === null || row.companyId === undefined || isCompanySyncing(row)) return;
  try {
    await proxy?.$modal.confirm(`确认将“${row.deptName}”的组织和人员同步到 OA 吗？`);
  } catch {
    return;
  }
  const companyKey = String(row.companyId);
  syncingCompanyIds.value = new Set([...syncingCompanyIds.value, companyKey]);
  try {
    const response = await syncCompanyOrganizationToOa(row.companyId);
    const result = response.data || {};
    proxy?.$modal.msgSuccess(
      `OA同步完成：部门新增${Number(result.departmentCreated || 0)}、更新${Number(result.departmentUpdated || 0)}；人员新增${Number(result.userCreated || 0)}、更新${Number(result.userUpdated || 0)}`
    );
  } finally {
    const next = new Set(syncingCompanyIds.value);
    next.delete(companyKey);
    syncingCompanyIds.value = next;
  }
};

const openEnterpriseEntryDialog = () => {
  enterpriseEntryForm.value = createEmptyEnterpriseEntryForm();
  enterpriseEntryDialog.visible = true;
  nextTick(() => enterpriseEntryFormRef.value?.clearValidate());
};

const normalizeEnterprisePhone = (field: EnterprisePhoneField) => {
  const value = enterpriseEntryForm.value[field];
  enterpriseEntryForm.value[field] = String(value || '').replace(/\D/g, '');
};

const submitEnterpriseEntry = () => {
  enterpriseEntryFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      proxy?.$modal.msgWarning('请检查企业必填信息和格式');
      return;
    }
    enterpriseEntrySubmitting.value = true;
    try {
      const payload = {
        ...enterpriseEntryForm.value,
        socialCreditCode: String(enterpriseEntryForm.value.socialCreditCode || '')
          .trim()
          .toUpperCase(),
        status: '0'
      };
      await entryCompanyDepartment(payload);
      proxy?.$modal.msgSuccess('企业已录入并提交审核，企业根节点已带入部门树');
      enterpriseEntryDialog.visible = false;
      await getList();
    } finally {
      enterpriseEntrySubmitting.value = false;
    }
  });
};

const enterpriseStatusMeta = (status?: string) => {
  const map: Record<string, { label: string; type: 'success' | 'warning' | 'danger' | 'info' | 'primary' }> = {
    '0': { label: '待审核', type: 'warning' },
    '1': { label: '已认证', type: 'success' },
    '2': { label: '已禁用', type: 'danger' },
    '4': { label: '草稿', type: 'warning' }
  };
  return map[String(status ?? '')] || { label: '未知', type: 'info' as const };
};

const resolveEnterpriseCandidates = (response: any): { rows: CompanyVO[]; total: number } => {
  const payload = response?.data && !Array.isArray(response.data) ? response.data : response;
  const rows = payload?.rows || payload?.records || response?.rows || [];
  return { rows: Array.isArray(rows) ? rows : [], total: Number(payload?.total ?? response?.total ?? rows.length) || 0 };
};

const loadEnterpriseCandidates = async () => {
  enterpriseImportLoading.value = true;
  try {
    const response = await listCompany({ ...enterpriseImportQuery, deleted: '0' });
    const payload = resolveEnterpriseCandidates(response);
    enterpriseCandidates.value = payload.rows;
    enterpriseImportTotal.value = payload.total;
  } finally {
    enterpriseImportLoading.value = false;
  }
};

const openEnterpriseImportDialog = async () => {
  selectedEnterpriseIds.value = [];
  enterpriseImportQuery.pageNum = 1;
  enterpriseImportDialog.visible = true;
  await loadImportedCompanyIds();
  await loadEnterpriseCandidates();
};

const queryEnterpriseCandidates = async () => {
  enterpriseImportQuery.pageNum = 1;
  selectedEnterpriseIds.value = [];
  enterpriseImportTableRef.value?.clearSelection();
  await loadEnterpriseCandidates();
};

const resetEnterpriseImportQuery = async () => {
  enterpriseImportQuery.pageNum = 1;
  enterpriseImportQuery.pageSize = 10;
  enterpriseImportQuery.companyName = '';
  enterpriseImportQuery.companyNo = '';
  enterpriseImportQuery.status = '';
  await queryEnterpriseCandidates();
};

const handleEnterpriseImportSizeChange = async () => {
  enterpriseImportQuery.pageNum = 1;
  await loadEnterpriseCandidates();
};

const isEnterpriseImported = (row: CompanyVO) =>
  row.companyId !== null && row.companyId !== undefined && importedCompanyIds.value.has(String(row.companyId));
const isEnterpriseSelectable = (row: CompanyVO) => !isEnterpriseImported(row);

const handleEnterpriseSelectionChange = (rows: CompanyVO[]) => {
  selectedEnterpriseIds.value = rows
    .map((row) => row.companyId)
    .filter((companyId): companyId is number | string => companyId !== null && companyId !== undefined);
};

const submitEnterpriseImport = async () => {
  if (selectedEnterpriseIds.value.length === 0) return;
  if (selectedEnterpriseIds.value.length > 100) {
    proxy?.$modal.msgWarning('单次最多导入100家企业');
    return;
  }
  enterpriseImportSubmitting.value = true;
  try {
    const response = await importCompanyDepartments(selectedEnterpriseIds.value);
    const result = (response.data || {}) as CompanyDepartmentImportResult;
    const successCount = Number(result.importedCount || 0) + Number(result.linkedCount || 0);
    proxy?.$modal.msgSuccess(`已带入${successCount}家企业${result.skippedCount ? `，跳过${result.skippedCount}家` : ''}`);
    selectedEnterpriseIds.value = [];
    enterpriseImportTableRef.value?.clearSelection();
    await getList();
    await loadImportedCompanyIds();
    await loadEnterpriseCandidates();
  } finally {
    enterpriseImportSubmitting.value = false;
  }
};
/** 展开/折叠所有 */
const toggleExpandAll = (data: DeptVO[], status: boolean) => {
  data.forEach((item) => {
    deptTableRef.value?.toggleRowExpansion(item, status);
    if (item.children && item.children.length > 0) toggleExpandAll(item.children, status);
  });
};

const openOrgTemplateDialog = () => {
  selectedOrgTemplateNode.value = undefined;
  activeOrgTemplateKey.value = 'standard';
  orgTemplateDialog.visible = true;
};

const handleOrgTemplateNodeClick = (data: OrgTemplateNode) => {
  selectedOrgTemplateNode.value = data;
};

const fillTemplateDeptForm = (node: OrgTemplateNode) => {
  form.value.deptName = node.deptName;
  form.value.deptCategory = node.deptCategory;
  form.value.orderNum = node.orderNum;
  form.value.status = '0';
};

const handleAddFromOrgTemplate = async () => {
  if (!selectedOrgTemplateNode.value) return;
  await handleAdd();
  fillTemplateDeptForm(selectedOrgTemplateNode.value);
  dialog.title = '按模板添加部门';
  orgTemplateDialog.visible = false;
};

const handleCustomOrgBuild = async () => {
  await handleAdd();
  dialog.title = '自定义添加部门';
  orgTemplateDialog.visible = false;
};

/** 新增按钮操作 */
const handleAdd = async (row?: DeptVO) => {
  reset();
  const res = await listDept();
  const data = proxy?.handleTree<DeptOptionsType>(res.data, 'deptId');
  if (data) {
    deptOptions.value = data;
    if (row && row.deptId) {
      form.value.parentId = row?.deptId;
    }
    dialog.visible = true;
    dialog.title = '添加部门';
  }
};

/** 修改按钮操作 */
const handleUpdate = async (row: DeptVO) => {
  reset();
  //查询当前部门所有用户
  getDeptAllUser(row.deptId);
  const res = await getDept(row.deptId);
  form.value = res.data;
  const response = await listDeptExcludeChild(row.deptId);
  const data = proxy?.handleTree<DeptOptionsType>(response.data, 'deptId');
  if (data) {
    deptOptions.value = data;
    if (data.length === 0) {
      const noResultsOptions: DeptOptionsType = {
        deptId: res.data.parentId,
        deptName: res.data.parentName,
        children: []
      };
      deptOptions.value.push(noResultsOptions);
    }
  }
  dialog.visible = true;
  dialog.title = '修改部门';
};
/** 提交按钮 */
const submitForm = () => {
  deptFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.deptId ? await updateDept(form.value) : await addDept(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};
/** 删除按钮操作 */
const handleDelete = async (row: DeptVO) => {
  await proxy?.$modal.confirm('是否确认删除名称为"' + row.deptName + '"的数据项?');
  await delDept(row.deptId);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.org-template-layout {
  display: grid;
  gap: 12px;
}

.org-scope-tabs {
  padding: 0 4px;
}

.org-scope-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.org-template-desc {
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.org-template-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.org-template-text {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.org-template-node {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.dept-name-cell {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.company-node-icon {
  flex: 0 0 auto;
  color: var(--el-color-success);
}

.internal-node-icon {
  flex: 0 0 auto;
  color: var(--el-color-primary);
}

:deep(.el-table .b-company-row > .el-table__cell) {
  background-color: var(--el-color-success-light-9);
}

:deep(.el-table .b-company-row > .el-table__cell:first-child) {
  box-shadow: inset 3px 0 0 var(--el-color-success-light-5);
}

.enterprise-form-section {
  padding: 0 0 8px 10px;
  margin: 4px 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-left: 3px solid var(--el-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.enterprise-entry-dialog .el-dialog__body) {
  max-height: 72vh;
  overflow-y: auto;
}

.enterprise-import-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px;
  margin-bottom: 14px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-fill-color-lighter));
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 8px;
}

.enterprise-import-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.enterprise-import-desc {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.enterprise-import-query {
  padding: 12px 12px 0;
  margin-bottom: 12px;
  background: var(--el-fill-color-extra-light);
  border-radius: 8px;
}

.enterprise-import-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.enterprise-import-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  color: var(--el-text-color-secondary);
}
</style>
