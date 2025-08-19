package com.example.lt.model;

import java.time.LocalDateTime;
import java.util.Map;

public class TestExecution {
    private String executionId;
    private String testName;
    private String description;
    private String testPlanPath;
    private String containerId;
    private String containerName;
    private TestStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String resultPath;
    private String reportPath;
    private String logPath;
    private Map<String, Object> parameters;
    private String errorMessage;

    public enum TestStatus {
        PENDING,    // 等待执行
        RUNNING,    // 正在执行
        COMPLETED,  // 执行完成
        FAILED,     // 执行失败
        STOPPED,    // 手动停止
        TIMEOUT     // 执行超时
    }

    public TestExecution() {}

    public TestExecution(String executionId, String testName, String testPlanPath) {
        this.executionId = executionId;
        this.testName = testName;
        this.testPlanPath = testPlanPath;
        this.status = TestStatus.PENDING;
        this.startTime = LocalDateTime.now();
    }

    // Getters and Setters
    public String getExecutionId() { return executionId; }
    public void setExecutionId(String executionId) { this.executionId = executionId; }
    
    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getTestPlanPath() { return testPlanPath; }
    public void setTestPlanPath(String testPlanPath) { this.testPlanPath = testPlanPath; }
    
    public String getContainerId() { return containerId; }
    public void setContainerId(String containerId) { this.containerId = containerId; }
    
    public String getContainerName() { return containerName; }
    public void setContainerName(String containerName) { this.containerName = containerName; }
    
    public TestStatus getStatus() { return status; }
    public void setStatus(TestStatus status) { this.status = status; }
    
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    
    public String getResultPath() { return resultPath; }
    public void setResultPath(String resultPath) { this.resultPath = resultPath; }
    
    public String getReportPath() { return reportPath; }
    public void setReportPath(String reportPath) { this.reportPath = reportPath; }
    
    public String getLogPath() { return logPath; }
    public void setLogPath(String logPath) { this.logPath = logPath; }
    
    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
