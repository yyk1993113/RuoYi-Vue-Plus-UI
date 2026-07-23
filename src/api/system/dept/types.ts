/**
 * 部门查询参数
 */
export interface DeptQuery extends PageQuery {
  deptName?: string;
  deptCategory?: string;
  /** organization/dept 页签范围：平台内部部门或 B 端企业根节点 */
  orgScope?: 'internal' | 'company';
  certStatus?: 'not_submitted' | '0' | '1' | '2';
  status?: number;
}

/**
 * 部门类型
 */
export interface DeptVO extends BaseEntity {
  id: number | string;
  parentName: string;
  parentId: number | string;
  children: DeptVO[];
  deptId: number | string;
  deptName: string;
  deptCategory: string;
  companyId?: number | string;
  certStatus?: 'not_submitted' | '0' | '1' | '2';
  orderNum: number;
  leader: string;
  phone: string;
  email: string;
  status: string;
  delFlag: string;
  ancestors: string;
  menuId: string | number;
}

/**
 * 部门类型
 */
export interface DeptTreeVO extends BaseEntity {
  id: number | string;
  label: string;
  parentId: number | string;
  weight: number;
  children: DeptTreeVO[];
  disabled: boolean;
}

/**
 * 部门表单类型
 */
export interface DeptForm {
  parentName?: string;
  parentId?: number | string;
  children?: DeptForm[];
  deptId?: number | string;
  deptName?: string;
  deptCategory?: string;
  companyId?: number | string;
  orderNum?: number;
  leader?: string;
  phone?: string;
  email?: string;
  status?: string;
  delFlag?: string;
  ancestors?: string;
}
