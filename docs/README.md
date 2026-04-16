# 文档总览

本目录用于沉淀签证公司 Agent 项目的核心文档，作为 AI 团队和人工团队协作的统一依据。

## 当前文档

- `PRD.md`：产品需求基线
- `ARCHITECTURE.md`：系统总体架构
- `DATA_MODEL.md`：数据模型和数据治理要求
- `WORKFLOWS.md`：核心业务流程
- `SECURITY_BASELINE.md`：安全与合规基线
- `staging-verification-pack.md`：预发环境最小验收与演示前核对清单
- `demo-readiness-gate.md`：演示前 go/no-go 决策基线
- `runbooks/recovery-runbook.md`：服务恢复与故障处置最小 runbook
- `runbooks/migration-rollback-runbook.md`：数据库迁移回滚最小 runbook

## 使用方式

1. 先看 PRD，明确范围和目标。
2. 再看 ARCHITECTURE 与 DATA_MODEL，对齐技术与数据设计。
3. 然后看 WORKFLOWS，核对主流程和人工介入点。
4. 最后用 SECURITY_BASELINE 审查实现是否满足上线前最低要求。
