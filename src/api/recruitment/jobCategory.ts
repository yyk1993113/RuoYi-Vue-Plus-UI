import request from '@/utils/request';

// ========== 岗位类别/职位维护（左树右表） ==========
// 后端：AdminJobCategoryController（/admin/recruitment/jobCategory | /admin/recruitment/jobPosition）。
// 字段与库中存量表对齐：主键 id / 名称 name / 排序 sort / 状态 status(数字 0正常 1停用)。
// job_category 为左侧类别树（parentId=0 顶级，后端返回扁平列表，树由前端组装）；
// job_position 为右侧职位列表（挂类别节点）。ID 为 bigint，全程按 string 透传，严禁 Number()。

const baseUrl = '/admin/recruitment';

// 类别（树节点）。id 字段后端 Long 序列化为字符串；status 为数字 tinyint
export interface JobCategoryVO {
  id?: string | number;
  parentId?: string | number;
  name?: string;
  // 层级（顶级=1），后端维护，前端只读展示
  level?: number;
  sort?: number;
  status?: number | string; // 0正常 1停用（后端数字，比较时统一 String() 归一）
  createTime?: string;
  // 前端组树时挂载的子节点（非后端字段）
  children?: JobCategoryVO[];
}

// 职位（右侧列表行）
export interface JobPositionVO {
  id?: string | number;
  categoryId?: string | number;
  categoryName?: string; // 后端联树回填，列表展示用
  name?: string;
  sort?: number;
  status?: number | string; // 0正常 1停用
  createTime?: string;
}

export interface JobPositionQuery {
  pageNum?: number;
  pageSize?: number;
  categoryId?: string | number;
  name?: string;
  status?: number | string;
}

// App 端只读：职位类目级联树（类别树 + 各类别下职位标签，仅启用态）。
// 后端 AppJobCategoryController 整类 @SaIgnore 公开，基路径含 /api（/api/app/jobCategory/tree）；
// 本仓 request 不自动补前缀，故此处 url 直写后端全路径。发岗页只取类别节点作为职位类目选择器数据源。
export function getJobPositionTree() {
  return request.get<any>(`/api/app/jobCategory/tree`);
}

// ---------- 类别（左树） ----------

// 类别全量列表（扁平，前端按 parentId 组装树）
export function listJobCategory(params?: { name?: string; status?: number | string }) {
  return request.get<JobCategoryVO[]>(`${baseUrl}/jobCategory/list`, { params });
}

export function addJobCategory(data: JobCategoryVO) {
  return request.post(`${baseUrl}/jobCategory`, data);
}

export function updateJobCategory(data: JobCategoryVO) {
  return request.put(`${baseUrl}/jobCategory`, data);
}

export function delJobCategory(categoryId: string | number) {
  return request.delete(`${baseUrl}/jobCategory/${categoryId}`);
}

// 诊断：两张表在库中的真实列结构（存量表与实体映射不一致时，加载失败后调用展示比对）
export function getJobCategoryTableInfo() {
  return request.get<{ tableName: string; columnName: string; columnType: string; columnKey: string }[]>(`${baseUrl}/jobCategory/tableInfo`);
}

// ---------- 职位（右表） ----------

// 职位分页列表 → TableDataInfo(rows/total)
export function listJobPosition(query: JobPositionQuery) {
  return request.get<any>(`${baseUrl}/jobPosition/list`, { params: query });
}

export function addJobPosition(data: JobPositionVO) {
  return request.post(`${baseUrl}/jobPosition`, data);
}

export function updateJobPosition(data: JobPositionVO) {
  return request.put(`${baseUrl}/jobPosition`, data);
}

// 删除职位（支持批量，逗号拼接路径参数）
export function delJobPosition(positionIds: (string | number)[] | string | number) {
  const ids = Array.isArray(positionIds) ? positionIds.join(',') : positionIds;
  return request.delete(`${baseUrl}/jobPosition/${ids}`);
}
