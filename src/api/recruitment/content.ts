import request from '@/utils/request';

// ========== 运营台·内容配置（首页内容位） ==========
// 对接后端 AdminContentController（基路径 /admin/content，@SaCheckRole("admin")，仅运营角色）。
// 含五类首页内容位：轮播图 banner / 金刚区 kingkong / 技能课程 course / 求职干货 article / 求职服务 jobService。
// 五类接口风格完全一致：list(GET 分页) / get(GET 详情) / add(POST) / update(PUT) / del(DELETE 批量) / changeStatus(POST 切上下架/显隐)。
//
// 说明：本模块刻意与同目录 index.ts 分文件维护——
//   1) index.ts 正由其它运营台任务并行扩写，分文件可规避写冲突；
//   2) 内容位接口挂在独立的 /admin/content 控制器下，与 index.ts 的 /admin/recruitment 体系无耦合。

const contentUrl = '/admin/content';

// ---------- 内容位 VO 定义（字段与后端 com.ruoyi.project.domain.* 实体一一对应） ----------

// 轮播图 rec_banner
export interface BannerVO {
  bannerId?: number;
  title?: string; // 标题
  imageUrl?: string; // 图片URL
  linkUrl?: string; // 跳转链接/路由
  sort?: number; // 排序（值越小越靠前）
  status?: string; // 状态 0:隐藏 1:显示
  createTime?: string;
  remark?: string;
}

// 金刚区坑位 rec_kingkong（首页固定坑位，按 key 唯一）
export interface KingkongVO {
  kingkongId?: number;
  kingkongKey?: string; // 坑位唯一业务 key，如 resume/job/training
  name?: string; // 名称
  subtitle?: string; // 副标题
  coreValue?: string; // 核心价值（一句话卖点）
  description?: string; // 释义（详细说明）
  iconUrl?: string; // 图标URL
  linkUrl?: string; // 跳转链接/路由
  sort?: number;
  status?: string; // 状态 0:隐藏 1:显示
  createTime?: string;
  remark?: string;
}

// 技能课程 rec_course
export interface CourseVO {
  courseId?: number;
  title?: string; // 标题
  coverUrl?: string; // 封面图URL
  tags?: string; // 标签（多个用逗号分隔）
  lessonCount?: number; // 节数
  studyCount?: number; // 学习人数
  price?: number; // 价格（元，0 表示免费）
  content?: string; // 课程内容/详情
  sort?: number;
  status?: string; // 状态 0:下架 1:上架
  createTime?: string;
  remark?: string;
}

// 求职干货文章 rec_article
export interface ArticleVO {
  articleId?: number;
  title?: string; // 标题
  coverUrl?: string; // 封面图URL
  tags?: string; // 标签（多个用逗号分隔）
  readCount?: number; // 阅读数
  content?: string; // 正文内容
  sort?: number;
  status?: string; // 状态 0:下架 1:上架
  createTime?: string;
  remark?: string;
}

// 求职服务 rec_job_service
export interface JobServiceVO {
  serviceId?: number;
  name?: string; // 名称
  description?: string; // 描述
  iconUrl?: string; // 图标URL
  linkUrl?: string; // 跳转链接/路由
  sort?: number;
  status?: string; // 状态 0:隐藏 1:显示
  createTime?: string;
  remark?: string;
}

// 内容位通用分页查询参数（标题/名称/状态按 tab 取用；后端实体直接接收同名字段做条件过滤）
export interface ContentQuery {
  pageNum?: number;
  pageSize?: number;
  title?: string; // banner/course/article 用标题过滤
  name?: string; // kingkong/jobService 用名称过滤
  status?: string;
}

// ---------- 轮播图 Banner ----------

export function listBanner(query: ContentQuery) {
  return request.get<any>(`${contentUrl}/banner/list`, { params: query });
}

export function getBanner(bannerId: number) {
  return request.get<any>(`${contentUrl}/banner/${bannerId}`);
}

export function addBanner(data: BannerVO) {
  return request.post(`${contentUrl}/banner`, data);
}

export function updateBanner(data: BannerVO) {
  return request.put(`${contentUrl}/banner`, data);
}

export function delBanner(bannerIds: number | number[]) {
  return request.delete(`${contentUrl}/banner/${bannerIds}`);
}

// 切换显隐：后端仅取 bannerId + status
export function changeBannerStatus(data: { bannerId: number; status: string }) {
  return request.post(`${contentUrl}/banner/changeStatus`, data);
}

// ---------- 金刚区 Kingkong ----------

export function listKingkong(query: ContentQuery) {
  return request.get<any>(`${contentUrl}/kingkong/list`, { params: query });
}

export function getKingkong(kingkongId: number) {
  return request.get<any>(`${contentUrl}/kingkong/${kingkongId}`);
}

export function addKingkong(data: KingkongVO) {
  return request.post(`${contentUrl}/kingkong`, data);
}

export function updateKingkong(data: KingkongVO) {
  return request.put(`${contentUrl}/kingkong`, data);
}

export function delKingkong(kingkongIds: number | number[]) {
  return request.delete(`${contentUrl}/kingkong/${kingkongIds}`);
}

export function changeKingkongStatus(data: { kingkongId: number; status: string }) {
  return request.post(`${contentUrl}/kingkong/changeStatus`, data);
}

// ---------- 技能课程 Course ----------

export function listCourse(query: ContentQuery) {
  return request.get<any>(`${contentUrl}/course/list`, { params: query });
}

export function getCourse(courseId: number) {
  return request.get<any>(`${contentUrl}/course/${courseId}`);
}

export function addCourse(data: CourseVO) {
  return request.post(`${contentUrl}/course`, data);
}

export function updateCourse(data: CourseVO) {
  return request.put(`${contentUrl}/course`, data);
}

export function delCourse(courseIds: number | number[]) {
  return request.delete(`${contentUrl}/course/${courseIds}`);
}

export function changeCourseStatus(data: { courseId: number; status: string }) {
  return request.post(`${contentUrl}/course/changeStatus`, data);
}

// ---------- 求职干货 Article ----------

export function listArticle(query: ContentQuery) {
  return request.get<any>(`${contentUrl}/article/list`, { params: query });
}

export function getArticle(articleId: number) {
  return request.get<any>(`${contentUrl}/article/${articleId}`);
}

export function addArticle(data: ArticleVO) {
  return request.post(`${contentUrl}/article`, data);
}

export function updateArticle(data: ArticleVO) {
  return request.put(`${contentUrl}/article`, data);
}

export function delArticle(articleIds: number | number[]) {
  return request.delete(`${contentUrl}/article/${articleIds}`);
}

export function changeArticleStatus(data: { articleId: number; status: string }) {
  return request.post(`${contentUrl}/article/changeStatus`, data);
}

// ---------- 求职服务 JobService ----------

export function listJobService(query: ContentQuery) {
  return request.get<any>(`${contentUrl}/jobService/list`, { params: query });
}

export function getJobService(serviceId: number) {
  return request.get<any>(`${contentUrl}/jobService/${serviceId}`);
}

export function addJobService(data: JobServiceVO) {
  return request.post(`${contentUrl}/jobService`, data);
}

export function updateJobService(data: JobServiceVO) {
  return request.put(`${contentUrl}/jobService`, data);
}

export function delJobService(serviceIds: number | number[]) {
  return request.delete(`${contentUrl}/jobService/${serviceIds}`);
}

export function changeJobServiceStatus(data: { serviceId: number; status: string }) {
  return request.post(`${contentUrl}/jobService/changeStatus`, data);
}
