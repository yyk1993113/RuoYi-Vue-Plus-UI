export interface LoginInfoVO {
  infoId: string | number;
  tenantId: string | number;
  userName: string;
  clientKey?: string;
  deviceType?: string;
  status: string;
  ipaddr: string;
  loginLocation: string;
  browser: string;
  os: string;
  msg: string;
  loginTime: string;
}

export interface LoginInfoQuery extends PageQuery {
  ipaddr: string;
  userName: string;
  deviceType?: string;
  deptId?: string | number;
  status: string;
  orderByColumn: string;
  isAsc: string;
}
