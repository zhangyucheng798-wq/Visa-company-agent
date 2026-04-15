# 数据模型

## 1. 数据目标
支持案件处理、文档追踪、审核协同、审计留痕和经营分析。

## 2. 核心实体
- tenants
- users
- roles
- organizations
- clients
- beneficiaries
- visa_cases
- case_stages
- documents
- document_versions
- extracted_fields
- workflow_runs
- tasks
- approvals
- notes
- notifications
- audit_logs
- billing_accounts

## 3. 设计原则
- 核心业务表优先规范化
- 文件与元数据分离
- 状态变更留事件或审计记录
- 严格租户隔离
- 关键表有明确索引策略

## 4. 治理要求
- 关键敏感字段分级
- 具备保留和清除策略
- 支持导出审计
- 迁移需要评审和回滚方案
