

package com.example.lt.service;

import com.example.lt.config.AppConfig;
import com.example.lt.model.TestExecution;
import com.example.lt.model.TestExecutionRequest;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.model.Bind;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.InitializingBean;
import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;

@Service
public class JMeterService implements InitializingBean {
    private static final Logger logger = LoggerFactory.getLogger(JMeterService.class);

    @Autowired
    private AppConfig appConfig;

    private DockerClient dockerClient;
    private final Map<String, TestExecution> runningTests = new ConcurrentHashMap<>();

    @Override
    public void afterPropertiesSet() {
        try {
            DefaultDockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                    .withDockerHost("unix:///var/run/docker.sock")
                    .build();

            ApacheDockerHttpClient httpClient = new ApacheDockerHttpClient.Builder()
                    .dockerHost(config.getDockerHost())
                    .build();

            dockerClient = DockerClientImpl.getInstance(config, httpClient);

            logger.info("Docker客户端初始化成功");
        } catch (Exception e) {
            logger.error("Docker客户端初始化失败", e);
            throw new RuntimeException("无法连接到Docker", e);
        }
    }

    public TestExecution startTest(TestExecutionRequest request) {
        String executionId = generateExecutionId();
        String testName = request.getTestName() != null ? request.getTestName() : "LoadTest";

        TestExecution execution = new TestExecution(executionId, testName, request.getTestPlanPath());
        execution.setDescription(request.getDescription());
        execution.setParameters(buildParameters(request));

        try {
            // 验证测试计划文件
            validateTestPlan(request.getTestPlanPath());

            // 创建输出目录
            String outputDir = createOutputDirectory(executionId);
            execution.setResultPath(outputDir + "/results.jtl");
            // 报告改为位于 /data/reports 下的独立目录，避免与结果混放
            String reportRel = outputDir.replaceFirst("^results/", "reports/");
            execution.setReportPath(reportRel);
            execution.setLogPath(outputDir + "/jmeter.log");

            // 创建并启动容器
            String containerId = createAndStartContainer(request, executionId, outputDir);
            execution.setContainerId(containerId);
            execution.setContainerName(appConfig.getJmeter().getContainerNamePrefix() + "-" + executionId);
            execution.setStatus(TestExecution.TestStatus.RUNNING);

            runningTests.put(executionId, execution);

            // 异步监控容器状态
            monitorContainerAsync(execution);

            logger.info("JMeter测试启动成功: {}", executionId);
            return execution;

        } catch (Exception e) {
            execution.setStatus(TestExecution.TestStatus.FAILED);
            execution.setErrorMessage(e.getMessage());
            execution.setEndTime(LocalDateTime.now());
            logger.error("启动JMeter测试失败: {}", executionId, e);
            throw new RuntimeException("启动测试失败: " + e.getMessage(), e);
        }
    }

    private void validateTestPlan(String testPlanPath) {
        File testPlanFile = new File(appConfig.getDataDir(), testPlanPath);
        if (!testPlanFile.exists()) {
            throw new IllegalArgumentException("测试计划文件不存在: " + testPlanPath);
        }
        if (!testPlanFile.getName().toLowerCase().endsWith(".jmx")) {
            throw new IllegalArgumentException("测试计划文件必须是.jmx格式");
        }
    }

    private String createOutputDirectory(String executionId) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String outputDir = String.format("results/%s_%s", timestamp, executionId);

        File dir = new File(appConfig.getDataDir(), outputDir);
        if (!dir.mkdirs()) {
            logger.warn("创建输出目录失败或目录已存在: {}", dir.getAbsolutePath());
        }
        // 同步创建对应的 reports 目录，确保 -o 可写
        File reportDir = new File(appConfig.getDataDir(), outputDir.replaceFirst("^results/", "reports/"));
        if (!reportDir.mkdirs()) {
            logger.warn("创建报告目录失败或目录已存在: {}", reportDir.getAbsolutePath());
        }

        return outputDir;
    }

    private String createAndStartContainer(TestExecutionRequest request, String executionId, String outputDir) {
        String containerName = appConfig.getJmeter().getContainerNamePrefix() + "-" + executionId;

        // 构建JMeter命令
        List<String> command = buildJMeterCommand(request, outputDir);
        logger.info("JMeter CMD: {}", String.join(" ", command));

        // 创建容器
        CreateContainerResponse container = dockerClient.createContainerCmd(appConfig.getJmeter().getImage())
                .withName(containerName)
                .withCmd(command)
                .withHostConfig(HostConfig.newHostConfig()
                        .withBinds(
                                Bind.parse(appConfig.getJmeter().getHostDataDir() + ":/data"))
                        .withAutoRemove(false))
                .withWorkingDir("/data")
                .exec();

        // 启动容器
        dockerClient.startContainerCmd(container.getId()).exec();

        logger.info("JMeter容器创建并启动: {} ({})", containerName, container.getId());
        return container.getId();
    }

    private List<String> buildJMeterCommand(TestExecutionRequest request, String outputDir) {
        List<String> command = new ArrayList<>();
        // 不要添加 "jmeter"；justb4/jmeter 镜像的 ENTRYPOINT 已是 jmeter
        command.add("-n"); // 非GUI模式
        command.add("-t");
        command.add("/data/" + request.getTestPlanPath());
        command.add("-l");
        command.add("/data/" + outputDir + "/results.jtl");
        command.add("-j");
        command.add("/data/" + outputDir + "/jmeter.log");
        // 输出报告到 /data/reports 下的对应目录
        String reportRel = outputDir.replaceFirst("^results/", "reports/");
        command.add("-e"); command.add("-o"); command.add("/data/" + reportRel + "/");
        command.add("-f"); // 报告

        // 确保 JTL 为 CSV，并打印表头、使用毫秒时间戳，字段齐全
        command.add("-Jjmeter.save.saveservice.output_format=csv");
        command.add("-Jjmeter.save.saveservice.print_field_names=true");
        command.add("-Jjmeter.save.saveservice.timestamp_format=ms");
        command.add("-Jjmeter.save.saveservice.default_delimiter=,");
        // 确保包含 allThreads (grpThreads/allThreads/Latency)
        command.add("-Jjmeter.save.saveservice.latency=true");
        command.add("-Jjmeter.save.saveservice.label=true");
        command.add("-Jjmeter.save.saveservice.successful=true");
        command.add("-Jjmeter.save.saveservice.thread_counts=true");

        // 将 UI 的线程/循环/RampUp/持续时间映射为 JMeter 属性（要求 .jmx 使用相同变量名）
        if (request.getThreads() > 0) {
            command.add("-Jthreads=" + request.getThreads());
        }
        if (request.getLoops() > 0) {
            command.add("-Jloops=" + request.getLoops());
        }
        if (request.getRampUp() >= 0) {
            command.add("-JrampUp=" + request.getRampUp());
        }
        if (request.getTimeout() > 0) {
            command.add("-Jduration=" + request.getTimeout());
        }

        // 追加自定义属性
        if (request.getProperties() != null) {
            for (Map.Entry<String, String> entry : request.getProperties().entrySet()) {
                command.add("-J" + entry.getKey() + "=" + entry.getValue());
            }
        }

        return command;
    }

    private Map<String, Object> buildParameters(TestExecutionRequest request) {
        Map<String, Object> params = new HashMap<>();
        params.put("threads", request.getThreads());
        params.put("loops", request.getLoops());
        params.put("rampUp", request.getRampUp());
        params.put("timeout", request.getTimeout());
        params.put("heapSize", request.getHeapSize());
        if (request.getProperties() != null) {
            params.put("properties", request.getProperties());
        }
        return params;
    }

    private void monitorContainerAsync(TestExecution execution) {
        CompletableFuture.runAsync(() -> {
            try {
                Integer exitCode = dockerClient.waitContainerCmd(execution.getContainerId()).start()
                    .awaitStatusCode();
                execution.setEndTime(LocalDateTime.now());
                if (exitCode == 0) {
                    execution.setStatus(TestExecution.TestStatus.COMPLETED);
                    logger.info("JMeter测试完成: {}", execution.getExecutionId());
                } else {
                    execution.setStatus(TestExecution.TestStatus.FAILED);
                    execution.setErrorMessage("容器退出码: " + exitCode);
                    logger.error("JMeter测试失败: {}, 退出码: {}", execution.getExecutionId(), exitCode);
                }
            } catch (Exception e) {
                execution.setStatus(TestExecution.TestStatus.FAILED);
                execution.setErrorMessage("监控容器失败: " + e.getMessage());
                execution.setEndTime(LocalDateTime.now());
                logger.error("监控JMeter容器失败: {}", execution.getExecutionId(), e);
            } finally {
                // 无论成功/失败/停止，尽力生成报告（若 -e -o 未生成则回退用 -g -o -f）
                generateReportIfMissing(execution);
            }
        });
    }

    private void generateReportIfMissing(TestExecution execution) {
        try {
            String resultRel = execution.getResultPath();
            String reportRel = execution.getReportPath();
            if (resultRel == null || reportRel == null) {
                logger.warn("缺少结果或报告路径，跳过后备报告生成: execId={}", execution.getExecutionId());
                return;
            }
            File resultFile = new File(appConfig.getDataDir(), resultRel);
            // 如果报告路径仍是 results/.../report（旧目录），改写为 /data/reports
            if (reportRel.startsWith("results/")) {
                reportRel = reportRel.replaceFirst("^results/", "reports/");
            }
            File reportDir = new File(appConfig.getDataDir(), reportRel);
            if (!reportDir.exists()) { reportDir.mkdirs(); }

            if (!resultFile.exists() || resultFile.length() == 0) {
                logger.warn("结果文件不存在或为空，无法生成HTML报告: {}", resultFile.getAbsolutePath());
                return;
            }
            boolean reportOk = reportDir.exists() && reportDir.isDirectory() &&
                    Optional.ofNullable(reportDir.list()).map(arr -> arr.length > 0).orElse(false);
            if (reportOk) {
                logger.info("报告目录已存在且非空，跳过后备报告生成: {}", reportDir.getAbsolutePath());
                return;
            }

            // 使用独立容器执行仅生成报告的命令：jmeter -g <jtl> -o <report> -f
            List<String> cmd = new ArrayList<>();
            cmd.add("-g"); cmd.add("/data/" + resultRel);
            cmd.add("-o"); cmd.add("/data/" + reportRel);
            // 补偿时也强制写 CSV 参数，以防 result 是旧格式
            cmd.add("-Jjmeter.save.saveservice.output_format=csv");
            cmd.add("-Jjmeter.save.saveservice.print_field_names=true");
            cmd.add("-Jjmeter.save.saveservice.timestamp_format=ms");
            cmd.add("-f");

            String name = appConfig.getJmeter().getContainerNamePrefix() + "-report-" + execution.getExecutionId();
            logger.info("启动后备报告生成容器: {} -> {}", name, String.join(" ", cmd));

            CreateContainerResponse c = dockerClient.createContainerCmd(appConfig.getJmeter().getImage())
                    .withName(name)
                    .withCmd(cmd)
                    .withHostConfig(HostConfig.newHostConfig()
                            .withBinds(Bind.parse(appConfig.getJmeter().getHostDataDir() + ":/data"))
                            .withAutoRemove(true))
                    .withWorkingDir("/data")
                    .exec();
            dockerClient.startContainerCmd(c.getId()).exec();
            int rc = dockerClient.waitContainerCmd(c.getId()).start().awaitStatusCode();
            if (rc == 0) {
                logger.info("后备报告生成成功: {}", reportDir.getAbsolutePath());
            } else {
                logger.warn("后备报告生成失败，退出码: {}", rc);
            }
        } catch (Exception ex) {
            logger.error("后备报告生成异常", ex);
        }
    }

    public boolean stopTest(String executionId) {
        TestExecution execution = runningTests.get(executionId);
        if (execution == null) {
            logger.warn("测试执行不存在: {}", executionId);
            return false;
        }

        try {
            if (execution.getContainerId() != null) {
                String cid = execution.getContainerId();
                try {
                    // Try graceful stop: send SIGINT to allow JMeter to flush JTL and report phase to finish
                    logger.info("尝试优雅停止容器 (SIGINT): {}", cid);
                    dockerClient.killContainerCmd(cid).withSignal("SIGINT").exec();
                } catch (Exception e) {
                    logger.warn("发送SIGINT失败，继续 docker stop: {}", e.getMessage());
                }
                try {
                    // wait a short grace period before force stop
                    Thread.sleep(3000);
                } catch (InterruptedException ignored) {}
                try {
                    logger.info("执行 docker stop --time=15: {}", cid);
                    dockerClient.stopContainerCmd(cid).withTimeout(15).exec();
                } catch (Exception e) {
                    logger.warn("docker stop 失败，尝试 kill: {}", e.getMessage());
                    try { dockerClient.killContainerCmd(cid).withSignal("KILL").exec(); } catch (Exception ignore) {}
                }
                try {
                    // wait to ensure exit and file flush
                    dockerClient.waitContainerCmd(cid).start().awaitStatusCode();
                } catch (Exception ignore) {}
                logger.info("JMeter容器已停止: {}", cid);
            }

            execution.setStatus(TestExecution.TestStatus.STOPPED);
            execution.setEndTime(LocalDateTime.now());

            // 主动触发报告生成检查（而不仅依赖 finally 块）
            generateReportIfMissing(execution);

            return true;
        } catch (Exception e) {
            logger.error("停止JMeter测试失败: {}", executionId, e);
            return false;
        }
    }

    public TestExecution getTestExecution(String executionId) {
        return runningTests.get(executionId);
    }

    public Collection<TestExecution> getAllTestExecutions() {
        return runningTests.values();
    }

    private String generateExecutionId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}
