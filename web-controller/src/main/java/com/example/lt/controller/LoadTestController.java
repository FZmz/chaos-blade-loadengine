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
import java.util.Map;

@RestController
@RequestMapping("/api/loadtest")
@CrossOrigin(origins = "*")
public class LoadTestController {
    private static final Logger logger = LoggerFactory.getLogger(LoadTestController.class);

    @Autowired
    private JMeterService jmeterService;

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
            TestExecution execution = jmeterService.getTestExecution(executionId);
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
            Collection<TestExecution> executions = jmeterService.getAllTestExecutions();
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
            
            // 构建访问URL
            if (execution.getResultPath() != null) {
                // resultPath格式: results/20231201_123456_abc12345/results.jtl
                String resultFile = execution.getResultPath().replace("results/", "");
                results.put("resultUrl", "/results/" + resultFile);
            }
            if (execution.getReportPath() != null) {
                // reportPath格式: results/20231201_123456_abc12345/report
                String reportDir = execution.getReportPath().replace("results/", "");
                results.put("reportUrl", "/reports/" + reportDir + "/");
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
}
