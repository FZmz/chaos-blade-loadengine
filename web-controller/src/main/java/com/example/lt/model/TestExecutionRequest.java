package com.example.lt.model;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Min;
import java.util.Map;

public class TestExecutionRequest {
    @NotBlank(message = "测试计划文件路径不能为空")
    private String testPlanPath;
    
    private String testName;
    private String description;
    
    @Min(value = 1, message = "线程数必须大于0")
    private int threads = 1;
    
    @Min(value = 1, message = "循环次数必须大于0")
    private int loops = 1;
    
    @Min(value = 0, message = "Ramp-up时间不能为负数")
    private int rampUp = 0;
    
    @Min(value = 10, message = "超时时间不能少于10秒")
    private int timeout = 3600; // 默认1小时
    
    private String heapSize = "1g";
    private Map<String, String> properties;
    private Map<String, String> jvmArgs;

    public TestExecutionRequest() {}

    // Getters and Setters
    public String getTestPlanPath() { return testPlanPath; }
    public void setTestPlanPath(String testPlanPath) { this.testPlanPath = testPlanPath; }
    
    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public int getThreads() { return threads; }
    public void setThreads(int threads) { this.threads = threads; }
    
    public int getLoops() { return loops; }
    public void setLoops(int loops) { this.loops = loops; }
    
    public int getRampUp() { return rampUp; }
    public void setRampUp(int rampUp) { this.rampUp = rampUp; }
    
    public int getTimeout() { return timeout; }
    public void setTimeout(int timeout) { this.timeout = timeout; }
    
    public String getHeapSize() { return heapSize; }
    public void setHeapSize(String heapSize) { this.heapSize = heapSize; }
    
    public Map<String, String> getProperties() { return properties; }
    public void setProperties(Map<String, String> properties) { this.properties = properties; }
    
    public Map<String, String> getJvmArgs() { return jvmArgs; }
    public void setJvmArgs(Map<String, String> jvmArgs) { this.jvmArgs = jvmArgs; }
}
