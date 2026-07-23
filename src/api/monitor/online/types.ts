export interface OnlineQuery extends PageQuery {
  ipaddr: string;
  userName: string;
  deviceType?: string;
  deptId?: string | number;
}

export interface OnlineVO extends BaseEntity {
  tokenId: string;
  deptId?: string | number;
  deptName: string;
  userName: string;
  clientKey?: string;
  deviceType?: string;
  ipaddr: string;
  loginLocation: string;
  browser: string;
  os: string;
  loginTime: number;
}
