# ZY-V1 v9.0 升级计划

## 目标
将 mock 数据驱动的前端改造为真实可用的桌面客户端版本。

## 当前问题
1. `src/data/patientData.ts` 包含所有 mock 数据（5个患者完整数据）
2. 数据库 `hospital_ai.db` 有表结构，但只有基础患者数据（无聊天记录、医嘱、病程等）
3. 前端直接 import mock 数据，不通过 API
4. 后端 Rust commands 只实现了基础 CRUD，缺少丰富数据接口

## 升级步骤

### Phase 1: 数据库扩展 ✅
- [x] 扩展 patients 表（添加 surgery_type 字段）
- [x] 创建 patient_trends 表（检验趋势数据）
- [x] 创建 patient_drg 表（DRG 分组数据）
- [x] 创建 patient_orders 表（医嘱列表，JSON 格式）
- [x] 创建 patient_consults 表（会诊记录）
- [x] 扩展 messages 表（添加 has_actions, is_risk 字段）

### Phase 2: 后端 API 扩展 ✅
- [x] get_patient_detail - 获取患者完整详情
- [x] get_all_patient_details - 获取所有患者详情
- [x] create_patient_detail - 创建完整患者数据
- [x] update_patient_detail - 更新患者详情
- [x] get_patient_messages - 获取患者消息列表
- [x] add_patient_message - 添加患者消息
- [x] get_patient_trends - 获取检验趋势
- [x] get_patient_drg - 获取 DRG 信息

### Phase 3: 前端 API 层 ✅
- [x] 创建 `src/api/patientApi.ts` - 患者 API 封装
- [x] 创建 `src/api/types.ts` - API 响应类型
- [x] 修改 patientStore - 从 API 加载数据
- [x] 修改 App.tsx - 使用 API 替代 mock import

### Phase 4: 数据迁移 ✅
- [x] 将 patientData.ts 的 mock 数据写入数据库
- [x] 初始化所有关联数据（消息、趋势、DRG、医嘱、会诊）

### Phase 5: 功能优化 ✅
- [x] 患者切换时从数据库加载完整数据
- [x] 消息推送改为从数据库读取 + 定时推送
- [x] 医嘱/会诊/病程从数据库获取

## 数据库 Schema 变更

### 新增表
```sql
-- 检验趋势数据
CREATE TABLE patient_trends (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    wbc_data TEXT NOT NULL,  -- JSON array
    crp_data TEXT NOT NULL,  -- JSON array
    neut_data TEXT NOT NULL, -- JSON array
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- DRG 分组数据
CREATE TABLE patient_drg (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL UNIQUE,
    drg_group TEXT NOT NULL,
    weight REAL NOT NULL,
    estimated_cost REAL NOT NULL,
    used_cost REAL NOT NULL,
    risk TEXT NOT NULL,
    suggestions TEXT NOT NULL,  -- JSON array
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

### 扩展字段
```sql
-- patients 表新增
ALTER TABLE patients ADD COLUMN surgery_type TEXT DEFAULT '';

-- messages 表新增
ALTER TABLE messages ADD COLUMN has_actions INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN is_risk INTEGER DEFAULT 0;
```

## 文件变更清单
- `src-tauri/src/db.rs` - 数据库扩展
- `src-tauri/src/commands.rs` - API 命令扩展
- `src/api/patientApi.ts` - 新增 API 层
- `src/stores/patientStore.ts` - 改用 API
- `src/App.tsx` - 移除 mock 依赖
- `src/data/patientData.ts` - 保留作为数据迁移源
