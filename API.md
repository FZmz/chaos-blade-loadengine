## 负载测试系统 REST API 文档

本项目提供基于 Spring Boot 的 REST API，用于管理 JMeter 压测任务、文件上传与静态报告访问，以及实时指标获取。默认通过 Nginx 暴露对外服务。

- Base URL（示例）: http://<你的主机或域名>:8008
- 统一前缀: /api
- 返回格式: application/json（除 SSE 流）
- 认证: 当前无认证要求（无需 Authorization 头）
- CORS: 允许任意来源

---

## 统一响应封装

所有 JSON 接口返回如下结构（SSE 接口除外）:

- 字段
  - success (Boolean): 是否成功
  - message (String, 可空): 说明信息
  - data (Any, 可空): 有效载荷
  - error (String, 可空): 错误信息（失败时提供）

- 示例（成功）
  ```json
  {
    "success": true,
    "message": "操作成功",
    "data": { ... }
  }
  ```

- 示例（失败）
  ```json
  {
    "success": false,
    "error": "参数错误: xxx"
  }
  ```

- 常见状态码
  - 200 OK: 成功
  - 400 Bad Request: 参数错误或当前状态不允许操作
  - 404 Not Found: 资源不存在
  - 500 Internal Server Error: 服务器内部错误

---

## 一览：接口清单

- 文件上传与管理
  - POST /api/files/upload/testplan
  - POST /api/files/upload/data
  - POST /api/files/upload
  - GET /api/files/list
- 压测任务管理
  - POST /api/loadtest/start
  - POST /api/loadtest/stop/{executionId}
  - GET /api/loadtest/status/{executionId}
  - GET /api/loadtest/list
  - GET /api/loadtest/results/{executionId}
  - GET /api/loadtest/health
  - GET /api/loadtest/events/{executionId}?tail=100
  - GET /api/loadtest/summary/{executionId}
- 实时指标
  - GET /api/metrics/{executionId}
  - GET /api/metrics/stream/{executionId}（SSE）
- 静态资源（Nginx）
  - GET /results/{...} 原始结果文件（.jtl）
  - GET /reports/{...}/index.html HTML 报告

---

## 文件上传与管理 API

### 上传 JMeter 测试计划
- 接口名称: 上传测试计划（.jmx）
- 接口说明: 上传 JMeter 测试计划文件并生成可访问 URL
- 接口URL: /api/files/upload/testplan
- 接口方法: POST
- 请求头:
  - Content-Type: multipart/form-data
- 表单字段:
  - file (File): 必需。后缀必须为 .jmx
- 约束
  - 允许扩展名: jmx, csv, txt, json, xml, properties
  - 最大文件: 500MB
- 成功响应
  - 200 OK, application/json
  - data 为 FileUploadResult:
    - fileName (String): 存储文件名（带时间戳与随机后缀）
    - originalFileName (String): 原始文件名
    - fileType (String): 扩展名（不含点）
    - fileSize (Long): 字节数
    - uploadPath (String): 服务端绝对路径（/data/...）
    - accessUrl (String): 可访问 URL（由 BASE_PUBLIC_URL + 相对路径拼接）
    - uploadTime (Long): 上传时间戳（毫秒）
- 错误响应
  - 400: 文件为空、类型不支持、超限等
  - 500: 上传失败
- 示例（cURL）
  ```bash
  curl -X POST http://<host>:8008/api/files/upload/testplan \
    -F "file=@test-plan.jmx"
  ```

### 上传测试数据文件
- 接口名称: 上传测试数据（CSV/TXT 等）
- 接口说明: 上传数据文件（例如 CSV）用于测试计划
- 接口URL: /api/files/upload/data
- 接口方法: POST
- 请求头: Content-Type: multipart/form-data
- 表单字段:
  - file (File): 必需
- 约束与响应: 同上（允许扩展名覆盖 csv、txt 等）
- 示例（cURL）
  ```bash
  curl -X POST http://<host>:8008/api/files/upload/data \
    -F "file=@users.csv"
  ```

### 通用上传（可指定分类）
- 接口名称: 通用文件上传
- 接口说明: 上传任意受支持类型文件，按分类存储
- 接口URL: /api/files/upload
- 接口方法: POST
- 请求头: Content-Type: multipart/form-data
- 表单字段:
  - file (File): 必需
  - category (String): 可选，默认 misc。支持 testplan|jmx、data|csv、misc
- 成功/错误响应: 同上

### 获取文件列表
- 接口名称: 文件列表
- 接口说明: 按分类返回上传目录下的文件列表
- 接口URL: /api/files/list
- 接口方法: GET
- 请求参数: 无
- 成功响应
  - 200 OK
  - data 为 Map<String, List<String>>，键为分类 testplans/data/misc，值为该目录下文件的绝对路径字符串数组（例如 /data/uploads/testplans/xxx.jmx）
- 示例响应
  ```json
  {
    "success": true,
    "message": "文件列表获取成功",
    "data": {
      "testplans": ["/data/uploads/testplans/test-plan_20250101_120000_abcd1234.jmx"],
      "data": ["/data/uploads/data/users_20250101_120000_ef567890.csv"],
      "misc": []
    }
  }
  ```

---

## 压测任务管理 API

### 启动测试
- 接口名称: 启动 JMeter 压测
- 接口说明: 基于上传的 .jmx 启动容器化 JMeter 压测，并异步执行
- 接口URL: /api/loadtest/start
- 接口方法: POST
- 请求头: Content-Type: application/json
- 请求体（TestExecutionRequest）
  - testPlanPath (String): 必需。JMX 相对路径，如 uploads/testplans/xxx.jmx
  - testName (String): 可选。任务名
  - description (String): 可选。描述
  - threads (Integer): 可选，默认 1，≥1
  - loops (Integer): 可选，默认 1，≥1
  - rampUp (Integer): 可选，默认 0，≥0（秒）
  - duration (Integer): 可选，≥1（秒）。提供时系统会生成运行时 JMX 副本并按此持续时间运行，同时作为优雅停止上限
  - timeout (Integer): 可选，默认 3600，≥10（秒）。兜底上限
  - heapSize (String): 可选，默认 "1g"。JVM 堆大小（如 "2g"）
  - properties (Map<String,String>): 可选。传递给 JMeter 的 -J 属性集
  - jvmArgs (Map<String,String>): 可选。传递 JVM 参数键值（由服务组装）
- 成功响应
  - 200 OK
  - data 为 TestExecution:
    - executionId (String): 执行 ID
    - testName (String)
    - description (String)
    - testPlanPath (String)
    - containerId (String)
    - containerName (String)
    - status (String): PENDING|RUNNING|COMPLETED|FAILED|STOPPED|TIMEOUT
    - startTime (String): ISO 8601
    - endTime (String, 可空): ISO 8601
    - resultPath (String, 可空): 结果文件相对路径，如 results/20250101_120000_abcd1234/results.jtl
    - reportPath (String, 可空): 报告目录相对路径，如 reports/20250101_120000_abcd1234
    - logPath (String, 可空): 日志文件相对路径
    - parameters (Map<String,Object>, 可空): 运行参数
    - errorMessage (String, 可空)
- 错误响应
  - 400: 参数错误（例如 testPlanPath 不存在、约束不满足）
  - 500: 启动失败
- 示例（cURL）
  ```bash
  curl -X POST http://<host>:8008/api/loadtest/start \
    -H "Content-Type: application/json" \
    -d '{
      "testPlanPath": "uploads/testplans/test-plan.jmx",
      "testName": "API性能测试",
      "description": "登录+查询链路",
      "threads": 50,
      "loops": 1000,
      "rampUp": 60,
      "duration": 600,
      "timeout": 3600,
      "heapSize": "2g",
      "properties": { "host": "example.com", "port": "8080" }
    }'
  ```

### 停止测试
- 接口名称: 停止压测
- 接口说明: 停止运行中的 JMeter 容器
- 接口URL: /api/loadtest/stop/{executionId}
- 接口方法: POST
- 路径参数
  - executionId (String): 必需
- 成功响应
  - 200 OK，data: true
- 错误响应
  - 400: 测试不存在或已停止
  - 500: 停止失败
- 示例（cURL）
  ```bash
  curl -X POST http://<host>:8008/api/loadtest/stop/abcdef12
  ```

### 查询测试状态
- 接口名称: 获取测试状态
- 接口说明: 返回单个测试的最新执行信息
- 接口URL: /api/loadtest/status/{executionId}
- 接口方法: GET
- 路径参数: executionId (String)
- 成功响应
  - 200 OK，data: TestExecution
- 错误响应
  - 404: 未找到

### 获取测试结果链接
- 接口名称: 获取结果与报告路径
- 接口说明: 返回结果、报告、日志的相对路径和可访问 URL
- 接口URL: /api/loadtest/results/{executionId}
- 接口方法: GET
- 成功响应（data 为 Map<String,String>）
  - executionId
  - status
  - resultPath: 相对路径（results/.../results.jtl）
  - reportPath: 相对路径（reports/...）
  - logPath: 相对路径
  - resultUrl: 供浏览器访问的相对 URL（/results/.../results.jtl）
  - reportUrl: 供浏览器访问的报告首页（/reports/.../index.html）
- 错误响应
  - 404: 未找到
- 示例响应
  ```json
  {
    "success": true,
    "message": "获取测试结果成功",
    "data": {
      "executionId": "abcdef12",
      "status": "COMPLETED",
      "resultPath": "results/20250101_120000_abcdef12/results.jtl",
      "reportPath": "reports/20250101_120000_abcdef12",
      "logPath": "results/20250101_120000_abcdef12/jmeter.log",
      "resultUrl": "/results/20250101_120000_abcdef12/results.jtl",
      "reportUrl": "/reports/20250101_120000_abcdef12/index.html"
    }
  }
  ```

### 获取所有测试列表
- 接口名称: 测试列表
- 接口说明: 返回当前服务已知的所有测试执行信息（持久化+运行中）
- 接口URL: /api/loadtest/list
- 接口方法: GET
- 成功响应
  - 200 OK，data: TestExecution[]

### 获取事件流水（只读）
- 接口名称: 获取事件流水
- 接口说明: 返回最近 N 条事件（JSON Lines 原样字符串），用于审计与追踪
- 接口URL: /api/loadtest/events/{executionId}
- 接口方法: GET
- 查询参数: tail (Integer, 可选, 默认 100) —— 返回最近 N 条
- 成功响应
  - 200 OK，data: String[]（每行一个 JSON 字符串）
- 错误响应
  - 500: 读取失败
- 示例
  ```bash
  curl "http://<host>:8008/api/loadtest/events/abcdef12?tail=100"
  ```

### 获取汇总指标（只读）
- 接口名称: 获取汇总指标
- 接口说明: 返回执行完成后计算的汇总统计（来自 summary.json）
- 接口URL: /api/loadtest/summary/{executionId}
- 接口方法: GET
- 成功响应（data 为对象）
  - total (Long)、succ (Long)、err (Long)
  - avgRt (Double)、maxRt (Long)、minRt (Long)
- 错误响应
  - 404: 未找到
- 示例
  ```bash
  curl http://<host>:8008/api/loadtest/summary/abcdef12
  ```

### 健康检查
- 接口名称: 健康检查
- 接口说明: 服务存活与简要运行信息
- 接口URL: /api/loadtest/health
- 接口方法: GET
- 成功响应（data 为 Map）
  - status: "UP"
  - timestamp: 毫秒时间戳
  - runningTests: 运行中测试数量

---

## 实时指标 API

### 获取一次性快照
- 接口名称: 单次获取实时指标
- 接口说明: 从结果文件（.jtl）尾部解析计算当前窗口指标
- 接口URL: /api/metrics/{executionId}
- 接口方法: GET
- 路径参数: executionId (String)
- 成功响应（data 为 MetricsSnapshot）
  - executionId (String)
  - timestamp (Long): 生成时间（毫秒）
  - activeThreads (Long): 活动线程数
  - totalRequests (Long): 累计请求数
  - successCount (Long)
  - errorCount (Long)
  - avgResponseTime (Double): 平均响应时间（毫秒）
  - maxResponseTime (Long): 最大响应时间（毫秒）
  - minResponseTime (Long): 最小响应时间（毫秒）
  - errorRate (Double): 错误率（0~1）
  - throughput (Double): 吞吐（QPS/TPS，滑动窗口内）
- 错误响应
  - 404: 未找到（任务不存在或无结果文件）
- 示例（cURL）
  ```bash
  curl http://<host>:8008/api/metrics/abcdef12
  ```

### 订阅实时指标（SSE）
- 接口名称: 实时指标流（Server-Sent Events）
- 接口说明: 以 text/event-stream 持续推送 MetricsSnapshot，每 ~1s 更新一次
- 接口URL: /api/metrics/stream/{executionId}
- 接口方法: GET
- 请求头
  - Accept: text/event-stream
- 响应
  - 200 OK, Content-Type: text/event-stream
  - 消息示例
    ```
    data: {"executionId":"abcdef12","timestamp":1755607369000,"activeThreads":10,"totalRequests":1234,"successCount":1200,"errorCount":34,"avgResponseTime":210.5,"maxResponseTime":980,"minResponseTime":15,"errorRate":0.0276,"throughput":45.2}

    ```
- 说明
  - 连接无超时（服务端设置 0）
  - 当任务结束或客户端断开时，流结束
- 示例（cURL）
  ```bash
  curl -H "Accept: text/event-stream" \
    http://<host>:8008/api/metrics/stream/abcdef12
  ```

---

## 静态资源访问（通过 Nginx）

- 原始结果（.jtl）
  - URL: /results/{timestamp_id}/results.jtl
  - 示例: http://<host>:8008/results/20250101_120000_abcdef12/results.jtl
- HTML 报告
  - URL: /reports/{timestamp_id}/index.html
  - 示例: http://<host>:8008/reports/20250101_120000_abcdef12/index.html

说明:
- 上述 URL 可通过 “获取测试结果链接” 接口获得（reportUrl/resultUrl）
- Nginx 将 /data 目录中的 results/ 与 reports/ 映射为静态访问

---

## 配置与环境（与 API 相关）

- BASE_PUBLIC_URL
  - 用于拼接文件上传返回的 accessUrl（例如 http://<host>）
- DATA_DIR
  - 服务端数据根目录（默认 /data）
- JMETER_IMAGE, HOST_DATA_DIR, 容器名前缀等
  - 影响 JMeter 容器运行，但不直接影响 API 形态

---

## 示例：端到端使用

1) 上传测试计划
```bash
curl -X POST http://<host>:8008/api/files/upload/testplan \
  -F "file=@test-plan.jmx"
```

2) 启动压测
```bash
curl -X POST http://<host>:8008/api/loadtest/start \
  -H "Content-Type: application/json" \
  -d '{
    "testPlanPath": "uploads/testplans/test-plan_20250101_120000_abcd1234.jmx",
    "testName": "API性能测试",
    "threads": 50,
    "loops": 1000,
    "rampUp": 60
  }'
```

3) 查询状态
```bash
curl http://<host>:8008/api/loadtest/status/<executionId>
```

4) 获取结果链接
```bash
curl http://<host>:8008/api/loadtest/results/<executionId>
```

5) 查看实时指标
```bash
curl http://<host>:8008/api/metrics/<executionId>
# 或 SSE
curl -H "Accept: text/event-stream" http://<host>:8008/api/metrics/stream/<executionId>
```

---

## 字段与类型参考

- FileUploadResult
  - fileName, originalFileName, fileType, uploadPath, accessUrl: String
  - fileSize, uploadTime: Long
- TestExecution（状态流转：PENDING → RUNNING → COMPLETED/FAILED/STOPPED/TIMEOUT）
  - startTime/endTime: ISO 8601 字符串
- MetricsSnapshot
  - 响应时间单位均为毫秒

如需我将本页导出为独立的 README/API 文档文件或补充 OpenAPI/Swagger 规范，请告诉我你的目标文件路径与格式偏好。
