package com.example.lt.model;

public class MetricsSnapshot {
    private String executionId;
    private long timestamp;
    private long activeThreads;
    private long totalRequests;
    private long successCount;
    private long errorCount;
    private double avgResponseTime;
    private long maxResponseTime;
    private long minResponseTime;
    private double errorRate;
    private double throughput; // QPS/TPS over sliding window

    public String getExecutionId() { return executionId; }
    public void setExecutionId(String executionId) { this.executionId = executionId; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    public long getActiveThreads() { return activeThreads; }
    public void setActiveThreads(long activeThreads) { this.activeThreads = activeThreads; }
    public long getTotalRequests() { return totalRequests; }
    public void setTotalRequests(long totalRequests) { this.totalRequests = totalRequests; }
    public long getSuccessCount() { return successCount; }
    public void setSuccessCount(long successCount) { this.successCount = successCount; }
    public long getErrorCount() { return errorCount; }
    public void setErrorCount(long errorCount) { this.errorCount = errorCount; }
    public double getAvgResponseTime() { return avgResponseTime; }
    public void setAvgResponseTime(double avgResponseTime) { this.avgResponseTime = avgResponseTime; }
    public long getMaxResponseTime() { return maxResponseTime; }
    public void setMaxResponseTime(long maxResponseTime) { this.maxResponseTime = maxResponseTime; }
    public long getMinResponseTime() { return minResponseTime; }
    public void setMinResponseTime(long minResponseTime) { this.minResponseTime = minResponseTime; }
    public double getErrorRate() { return errorRate; }
    public void setErrorRate(double errorRate) { this.errorRate = errorRate; }
    public double getThroughput() { return throughput; }
    public void setThroughput(double throughput) { this.throughput = throughput; }
}

