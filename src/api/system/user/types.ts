import { RoleVO } from '@/api/system/role/types';
import { PostVO } from '@/api/system/post/types';

/**
 * 用户信息
 */
export interface UserInfo {
  user: UserVO;
  roles: string[];
  permissions: string[];
}

/**
 * 用户查询对象类型
 */
export interface UserQuery extends PageQuery {
  userName?: string;
  nickName?: string;
  phonenumber?: string;
  status?: string;
  userType?: string;
  deptId?: string | number;
  roleId?: string | number;
  userIds?: string | number | (string | number)[] | undefined;
}

/**
 * B端企业用户查询对象（用户管理页专用，不复用企业管理页查询状态）
 */
export interface BusinessUserQuery extends PageQuery {
  companyId?: string | number;
  companyName?: string;
  contactPerson?: string;
  contactPhone?: string;
  status?: string;
  isSilenced?: string;
  customerLayer?: string;
  jobCountMin?: number | string;
  jobCountMax?: number | string;
  applyCountMin?: number | string;
  applyCountMax?: number | string;
  paidStatus?: string;
  active7d?: string;
  params?: Record<string, any>;
}

/**
 * C端求职者查询对象（用户管理页专用，不复用求职者管理页查询状态）
 */
export interface JobSeekerUserQuery extends PageQuery {
  userName?: string;
  phonenumber?: string;
  isRecruitmentSilenced?: string;
  applyFilter?: string;
  applyCountMin?: number | string;
  applyCountMax?: number | string;
  interviewCountMin?: number | string;
  interviewCountMax?: number | string;
  userLayer?: string;
  activeStatus?: string;
  resumeStatus?: string;
  paidStatus?: string;
  registerChannel?: string;
  promoterKeyword?: string;
}

/**
 * 用户返回对象
 */
export interface UserVO extends BaseEntity {
  userId: string | number;
  tenantId: string;
  deptId: number;
  userName: string;
  nickName: string;
  userType: string;
  email: string;
  phonenumber: string;
  sex: string;
  avatar: string;
  status: string;
  delFlag: string;
  loginIp: string;
  loginDate: string;
  remark: string;
  deptName: string;
  roles: RoleVO[];
  roleIds: any;
  postIds: any;
  roleId: any;
  admin: boolean;
}

/**
 * 用户表单类型
 */
export interface UserForm {
  id?: string;
  userId?: string;
  deptId?: number;
  userName: string;
  nickName?: string;
  password: string;
  phonenumber?: string;
  email?: string;
  sex?: string;
  status: string;
  remark?: string;
  postIds: string[];
  roleIds: string[];
}

export interface UserInfoVO {
  user: UserVO;
  roles: RoleVO[];
  roleIds: string[];
  posts: PostVO[];
  postIds: string[];
  roleGroup: string;
  postGroup: string;
}

export interface ResetPwdForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
