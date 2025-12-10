# 项目设置和启动指南

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入您的私钥和 RPC URL
```

### 3. 编译合约

```bash
npm run compile
```

### 4. 运行测试

```bash
npm test
```

### 5. 本地部署

```bash
# 终端 1: 启动本地节点
npm run node

# 终端 2: 部署到本地
npm run deploy:local
```

### 6. Sepolia 测试网部署

```bash
npm run deploy:sepolia
npm run verify:sepolia
npm run initialize:sepolia
```

## 可用命令

### 编译和测试
```bash
npm run compile       # 编译合约
npm test             # 运行所有测试
npm run coverage     # 生成覆盖率报告
npm run clean        # 清理构建文件
```

### 部署
```bash
npm run deploy:local      # 部署到本地节点
npm run deploy:sepolia    # 部署到 Sepolia 测试网
npm run verify:sepolia    # 在 Etherscan 验证合约
npm run initialize:sepolia # 初始化合约状态
```

### 自动化脚本
```bash
npm run create-example   # 创建新示例
npm run create-category  # 创建分类示例
npm run generate-docs    # 生成文档
npm run monitor:events   # 监听合约事件
```

### 开发工具
```bash
npm run console:local    # 打开本地 Hardhat 控制台
npm run console:sepolia  # 打开 Sepolia Hardhat 控制台
npm run lint            # 检查代码规范
npm run format          # 格式化代码
npm run typecheck       # TypeScript 类型检查
```

## 项目结构

```
├── contracts/                    # Solidity 合约
│   └── ConfidentialRawMaterialsTrading.sol
├── test/                        # 测试文件
│   └── ConfidentialRawMaterialsTrading.test.ts
├── scripts/                     # 自动化脚本
│   ├── deploy.ts               # 部署脚本
│   ├── initialize.ts           # 初始化脚本
│   ├── monitor-events.ts       # 事件监听脚本
│   ├── create-fhevm-example.ts # 创建示例脚本
│   ├── create-fhevm-category.ts # 创建分类脚本
│   └── generate-docs.ts        # 文档生成脚本
├── docs/                        # 文档
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPER_GUIDE.md
│   └── SUBMISSION_INDEX.md
├── artifacts/                   # 编译输出
├── cache/                       # 缓存文件
├── hardhat.config.ts           # Hardhat 配置
├── package.json               # npm 配置
├── tsconfig.json              # TypeScript 配置
└── .env.example               # 环境变量模板
```

## 环境变量说明

### 必需配置
```
PRIVATE_KEY=0x...              # 部署账户私钥（仅用于测试网）
```

### 可选配置
```
SEPOLIA_RPC_URL=https://...    # Sepolia RPC 端点
ETHERSCAN_API_KEY=...          # Etherscan API 密钥（用于验证）
REPORT_GAS=true                # 是否生成 gas 报告
```

## 常见问题

### Q: 私钥应该从哪里获取？
A: 从 MetaMask 导出，但**仅用于测试网钱包**，永远不要在主网使用。

### Q: 如何获取 Sepolia ETH？
A: 访问 https://sepoliafaucet.com 或其他 Sepolia 水龙头。

### Q: 合约地址在哪里？
A: 部署后会保存在 `deployments/sepolia.json`

### Q: 如何验证合约？
A:
```bash
npm run verify:sepolia -- 0xYOUR_CONTRACT_ADDRESS
```

## 文档阅读指南

- **SUBMISSION.md**: 完整的竞赛提交文档
- **ARCHITECTURE.md**: 技术架构和设计
- **DEPLOYMENT.md**: 详细的部署指南
- **DEVELOPER_GUIDE.md**: 开发者指南和扩展说明
- **SUBMISSION_INDEX.md**: 文档导航索引

## 关键文件说明

### contracts/ConfidentialRawMaterialsTrading.sol
主合约，实现了完整的原始材料交易市场，使用 FHE 保护敏感数据。

**主要功能**:
- `listMaterial()`: 供应商列出材料（加密数量和价格）
- `placeOrder()`: 买家下单（加密需求和价格限制）
- `matchTrade()`: 供应商匹配订单（加密运算）
- `confirmTrade()`: 确认交易
- `verifySupplier()`: 验证供应商
- `verifyBuyer()`: 验证买家

### test/ConfidentialRawMaterialsTrading.test.ts
包含 45+ 个测试用例，覆盖：
- 合约部署
- 访问控制
- FHE 操作
- 业务逻辑
- 边界情况
- 常见错误模式

## 部署流程

```
1. 编译合约
   npm run compile

2. 运行测试
   npm test

3. 设置环境
   cp .env.example .env
   # 编辑 .env

4. 部署到 Sepolia
   npm run deploy:sepolia

5. 验证合约
   npm run verify:sepolia

6. 初始化状态
   npm run initialize:sepolia

7. 监听事件
   npm run monitor:events
```

## 使用自动化脚本

### 创建新示例

```bash
npm run create-example -- \
  --name MyExample \
  --category basic \
  --description "My FHE Example"
```

### 创建分类示例

```bash
npm run create-category -- --category access-control
```

### 生成文档

```bash
npm run generate-docs
```

## 联系和支持

- Zama 社区: https://www.zama.ai/community
- Zama Discord: https://discord.com/invite/zama
- 文档: https://docs.zama.ai
- GitHub: https://github.com/zama-ai/fhevm

## 许可证

MIT License - 详见 LICENSE 文件
