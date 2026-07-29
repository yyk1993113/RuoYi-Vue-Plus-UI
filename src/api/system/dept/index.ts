import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { DeptForm, DeptQuery, DeptTreeVO, DeptVO } from './types';

// 查询部门列表
export const listDept = (query?: DeptQuery) => {
  return request({
    url: '/system/dept/list',
    method: 'get',
    params: query
  });
};

/**
 * 通过deptIds查询部门
 * @param deptIds
 */
export const optionSelect = (deptIds: (number | string)[]): AxiosPromise<DeptVO[]> => {
  return request({
    url: '/system/dept/optionselect?deptIds=' + deptIds,
    method: 'get'
  });
};

// 查询部门列表（排除节点）
export const listDeptExcludeChild = (deptId: string | number): AxiosPromise<DeptVO[]> => {
  return request({
    url: '/system/dept/list/exclude/' + deptId,
    method: 'get'
  });
};

// 查询部门详细
export const getDept = (deptId: string | number): AxiosPromise<DeptVO> => {
  return request({
    url: '/system/dept/' + deptId,
    method: 'get'
  });
};

// 新增部门
export const addDept = (data: DeptForm) => {
  return request({
    url: '/system/dept',
    method: 'post',
    data: data
  });
};

// 修改部门
export const updateDept = (data: DeptForm) => {
  return request({
    url: '/system/dept',
    method: 'put',
    data: data
  });
};

// 删除部门
export const delDept = (deptId: number | string) => {
  return request({
    url: '/system/dept/' + deptId,
    method: 'delete'
  });
};

// 从企业管理中批量带入企业根节点；该入口只新增/绑定部门，不修改企业主体。
export const importCompanyDepartments = (companyIds: Array<number | string>) => {
  return request({
    url: '/admin/recruitment/company-department/import',
    method: 'post',
    data: { companyIds }
  });
};

// 部门页独立的企业录入入口；后端固定为新增并进入待审核，避免误更新既有企业。
export const entryCompanyDepartment = (data: Record<string, unknown>) => {
  return request({
    url: '/admin/recruitment/company-department/entry',
    method: 'post',
    data
  });
};

// 由招聘后端签名后服务端直连 OA；浏览器只传企业 ID，不接触 OA 地址或共享密钥。
export const syncCompanyOrganizationToOa = (companyId: number | string) => {
  return request({
    url: `/admin/recruitment/company-department/${companyId}/sync-oa`,
    method: 'post'
  });
};
