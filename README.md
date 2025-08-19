# 负载测试系统

基于 **Nginx + JMeter + Spring Boot + Docker** 的容器化负载测试系统，提供完整的REST API接口用于压测的启动、停止和数据获取。

## 系统架构

- **前端/代理**: Nginx - 反向代理和静态文件服务
- **负载测试引擎**: JMeter - 使用 `justb4/jmeter:latest` Docker镜像
- **Web Controller**: Spring Boot - 提供REST API接口
- **部署方式**: Docker容器化架构

## 核心功能

### 1. 文件上传管理
- 支持JMeter测试计划文件(.jmx)上传
- 支持测试数据文件(CSV等)上传
- 自动生成可访问的文件URL
- 文件分类管理和列表查询

### 2. 负载测试管理
- 启动JMeter负载测试
- 停止运行中的测试
- 查询测试执行状态
- 获取测试结果和性能数据

### 3. 结果和报告
- 自动生成HTML测试报告
- 提供原始结果文件访问
- 测试日志查看
- 静态文件服务

## 快速开始

### 1. 环境准备

确保已安装：
- Docker
- Docker Compose

### 2. 配置环境

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件，设置数据目录路径
vim .env
```

重要：请在 `.env` 文件中设置正确的 `HOST_DATA_DIR` 路径。

### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 验证服务

访问以下URL验证服务是否正常：

- 健康检查: http://1.94.151.57:8008/api/loadtest/health
- 文件列表: http://1.94.151.57:8008/api/files/list

## API接口文档

### 文件上传接口

#### 上传测试计划文件
```http
POST /api/files/upload/testplan
Content-Type: multipart/form-data

file: [JMX文件]
```

#### 上传测试数据文件
```http
POST /api/files/upload/data
Content-Type: multipart/form-data

file: [CSV/TXT文件]
```

#### 获取文件列表
```http
GET /api/files/list
```

### 负载测试接口

#### 启动测试
```http
POST /api/loadtest/start
Content-Type: application/json

{
  "testPlanPath": "uploads/testplans/test.jmx",
  "testName": "性能测试",
  "description": "测试描述",
  "threads": 10,
  "loops": 100,
  "rampUp": 60,
  "timeout": 3600,
  "heapSize": "2g",
  "properties": {
    "host": "example.com",
    "port": "8080"
  }
}
```

#### 停止测试
```http
POST /api/loadtest/stop/{executionId}
```

#### 查询测试状态
```http
GET /api/loadtest/status/{executionId}
```

#### 获取测试结果
```http
GET /api/loadtest/results/{executionId}
```

#### 获取所有测试列表
```http
GET /api/loadtest/list
```

## 目录结构

```
.
├── data/                   # 数据目录
│   ├── uploads/           # 上传文件
│   ├── results/           # 测试结果
│   └── reports/           # HTML报告
├── nginx/                 # Nginx配置
│   └── nginx.conf
├── web-controller/        # Spring Boot应用
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── docker-compose.yml     # Docker编排文件
├── .env.example          # 环境配置模板
└── README.md
```

## 使用示例

### 1. 上传测试计划

```bash
curl -X POST \
  http://1.94.151.57:8008/api/files/upload/testplan \
  -F "file=@test-plan.jmx"
```

### 2. 启动负载测试

```bash
curl -X POST \
  http://1.94.151.57:8008/api/loadtest/start \
  -H "Content-Type: application/json" \
  -d '{
    "testPlanPath": "uploads/testplans/test-plan_20231201_123456_abc12345.jmx",
    "testName": "API性能测试",
    "threads": 50,
    "loops": 1000,
    "rampUp": 300
  }'
```

### 3. 查看测试状态

```bash
curl http://1.94.151.57:8008/api/loadtest/status/{executionId}
```

### 4. 获取测试报告

测试完成后，可通过以下URL访问：
- HTML报告: http://1.94.151.57:8008/reports/{timestamp}_{executionId}/report/
- 原始结果: http://1.94.151.57:8008/results/{timestamp}_{executionId}/results.jtl

## 故障排除

### 常见问题

1. **容器启动失败**
   - 检查 `.env` 文件中的 `HOST_DATA_DIR` 路径是否正确
   - 确保数据目录有足够的权限

2. **文件上传失败**
   - 检查文件大小是否超过500MB限制
   - 确认文件格式是否支持

3. **JMeter测试启动失败**
   - 检查测试计划文件是否有效
   - 查看容器日志: `docker-compose logs lt-web`

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs lt-web
docker-compose logs lt-nginx

# 实时查看日志
docker-compose logs -f lt-web
```

## 开发说明

### 本地开发

1. 测试Docker构建（使用优化的镜像源）：
```bash
./build-test.sh
```

2. 修改代码后重新构建：
```bash
docker-compose build lt-web
docker-compose up -d lt-web
```

3. 查看应用日志：
```bash
docker-compose logs -f lt-web
```

### 构建优化

系统已针对中国网络环境进行了构建优化：

- **APT源**: 使用中科大镜像源，加速软件包下载
- **Maven仓库**: 使用阿里云Maven仓库，加速依赖下载
- **多阶段构建**: 减少最终镜像大小
- **Docker缓存**: 优化构建层缓存，提高重复构建速度
- **安全性**: 使用非root用户运行应用

### 扩展功能

系统采用模块化设计，可以方便地扩展以下功能：
- 测试结果数据库存储
- 用户认证和权限管理
- 测试计划模板管理
- 性能监控和告警
- 分布式测试支持

## 许可证

MIT License
