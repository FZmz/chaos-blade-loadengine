package com.example.lt.controller;

import com.example.lt.model.ApiResponse;
import com.example.lt.model.TestExecution;
import com.example.lt.model.TestExecutionRequest;
import com.example.lt.service.JMeterService;
import javax.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loadtest")
@CrossOrigin(origins = "*")
public class LoadTestController {
    private static final Logger logger = LoggerFactory.getLogger(LoadTestController.class);

    @Autowired
    private JMeterService jmeterService;

    @Autowired
    private com.example.lt.store.ExecutionStore store;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<TestExecution>> startTest(@Valid @RequestBody TestExecutionRequest request) {
        try {
            logger.info("接收启动负载测试请求: {}", request.getTestName());
            
            TestExecution execution = jmeterService.startTest(request);
            return ResponseEntity.ok(ApiResponse.success("负载测试启动成功", execution));
            
        } catch (IllegalArgumentException e) {
            logger.warn("启动负载测试参数错误: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("参数错误: " + e.getMessage()));
                
        } catch (Exception e) {
            logger.error("启动负载测试失败", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("启动测试失败: " + e.getMessage()));
        }
    }

    @PostMapping("/stop/{executionId}")
    public ResponseEntity<ApiResponse<Boolean>> stopTest(@PathVariable String executionId) {
        try {
            logger.info("接收停止负载测试请求: {}", executionId);
            
            boolean stopped = jmeterService.stopTest(executionId);
            if (stopped) {
                return ResponseEntity.ok(ApiResponse.success("负载测试停止成功", true));
            } else {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("测试不存在或已经停止"));
            }
            
        } catch (Exception e) {
            logger.error("停止负载测试失败: {}", executionId, e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("停止测试失败: " + e.getMessage()));
        }
    }

    @GetMapping("/status/{executionId}")
    public ResponseEntity<ApiResponse<TestExecution>> getTestStatus(@PathVariable String executionId) {
        try {
            TestExecution execution = store.findById(executionId);
            if (execution == null) {
                execution = jmeterService.getTestExecution(executionId);
            }
            if (execution != null) {
                return ResponseEntity.ok(ApiResponse.success("获取测试状态成功", execution));
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            logger.error("获取测试状态失败: {}", executionId, e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("获取测试状态失败: " + e.getMessage()));
        }
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<Collection<TestExecution>>> listTests() {
        try {
            // 优先读取持久化的历史记录（分页可按需调整）
            Collection<TestExecution> executions = store.list(0, 500);
            return ResponseEntity.ok(ApiResponse.success("获取测试列表成功", executions));

        } catch (Exception e) {
            logger.error("获取测试列表失败", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("获取测试列表失败: " + e.getMessage()));
        }
    }

    @GetMapping("/results/{executionId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> getTestResults(@PathVariable String executionId) {
        try {
            TestExecution execution = jmeterService.getTestExecution(executionId);
            if (execution == null) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, String> results = new HashMap<>();
            results.put("executionId", execution.getExecutionId());
            results.put("status", execution.getStatus().toString());
            results.put("resultPath", execution.getResultPath());
            results.put("reportPath", execution.getReportPath());
            results.put("logPath", execution.getLogPath());
            
            // 构建访问URL（静态资源由 Nginx 映射 /results 和 /reports）
            if (execution.getResultPath() != null) {
                // 例如: results/20231201_123456_abc12345/results.jtl
                String resultFile = execution.getResultPath().replaceFirst("^results/", "");
                results.put("resultUrl", "/results/" + resultFile);
            }
            if (execution.getReportPath() != null) {
                // 例如: reports/20231201_123456_abc12345/
                String reportDir = execution.getReportPath().replaceFirst("^reports/", "");
                results.put("reportUrl", "/reports/" + reportDir + "/index.html");
            }
            
            return ResponseEntity.ok(ApiResponse.success("获取测试结果成功", results));
            
        } catch (Exception e) {
            logger.error("获取测试结果失败: {}", executionId, e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("获取测试结果失败: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        try {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("timestamp", System.currentTimeMillis());
            health.put("runningTests", jmeterService.getAllTestExecutions().size());
            
            return ResponseEntity.ok(ApiResponse.success("服务健康检查", health));
            
        } catch (Exception e) {
            logger.error("健康检查失败", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("健康检查失败: " + e.getMessage()));
        }
    }

    // 只读：获取事件流水（最近 N 条，默认 100）
    @GetMapping("/events/{executionId}")
    public ResponseEntity<ApiResponse<List<String>>> getEvents(
            @PathVariable String executionId, @RequestParam(name = "tail", required = false, defaultValue = "100") int tail) {
        try {
            List<String> lines = store.tailEvents(executionId, tail);
            return ResponseEntity.ok(ApiResponse.success("获取事件流水成功", lines));
        } catch (Exception e) {
            logger.error("获取事件失败: {}", executionId, e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("获取事件失败: " + e.getMessage()));
        }
    }

    // 只读：获取汇总指标
    @GetMapping("/summary/{executionId}")
    public ResponseEntity<ApiResponse<Object>> getSummary(@PathVariable String executionId) {
        try {
            Object sum = store.loadSummary(executionId);
            if (sum == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(ApiResponse.success("获取汇总成功", sum));
        } catch (Exception e) {
            logger.error("获取汇总失败: {}", executionId, e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("获取汇总失败: " + e.getMessage()));
        }
    }
}
