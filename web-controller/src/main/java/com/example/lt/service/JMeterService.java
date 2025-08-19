

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
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class JMeterService implements InitializingBean {
    private static final Logger logger = LoggerFactory.getLogger(JMeterService.class);

    @Autowired
    private AppConfig appConfig;

    private DockerClient dockerClient;
    private final Map<String, TestExecution> runningTests = new ConcurrentHashMap<>();
    // 防止并发重复生成报告：每个 executionId 一把锁
    private final Map<String, Object> reportLocks = new ConcurrentHashMap<>();

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

            // 如指定 duration，则生成运行时 JMX 副本并替换配置
            String jmxRel = request.getDuration() != null && request.getDuration() > 0
                    ? prepareRuntimeJmx(request.getTestPlanPath(), outputDir, request.getDuration())
                    : request.getTestPlanPath();

            // 创建并启动容器
            String containerId = createAndStartContainer(request, executionId, outputDir, jmxRel);
            execution.setContainerId(containerId);
            execution.setContainerName(appConfig.getJmeter().getContainerNamePrefix() + "-" + executionId);
            execution.setStatus(TestExecution.TestStatus.RUNNING);

            runningTests.put(executionId, execution);

            // 外部兜底：如设置了 duration，到时优雅停止
            if (request.getDuration() != null && request.getDuration() > 0) {
                scheduleAutoStop(executionId, request.getDuration());
            }

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

    private String prepareRuntimeJmx(String srcRel, String outputDirRel, int durationSecs) throws IOException {
        java.nio.file.Path src = Paths.get(appConfig.getDataDir(), srcRel);
        String runtimeRel = outputDirRel + "/plan.runtime.jmx";
        java.nio.file.Path dst = Paths.get(appConfig.getDataDir(), runtimeRel);
        String xml = Files.readString(src, StandardCharsets.UTF_8);

        // 针对每个标准 ThreadGroup 做块级替换/插入
        Pattern tgPattern = Pattern.compile("(?s)<ThreadGroup\\b.*?</ThreadGroup>");
        Matcher matcher = tgPattern.matcher(xml);
        StringBuffer sb = new StringBuffer();
        String d = Integer.toString(durationSecs);
        while (matcher.find()) {
            String block = matcher.group();
            String b2 = block;
            // scheduler=false -> true
            b2 = b2.replaceAll(
                "<boolProp\\s+name=\"ThreadGroup\\.scheduler\">\\s*false\\s*</boolProp>",
                "<boolProp name=\"ThreadGroup.scheduler\">true</boolProp>");
            if (!b2.contains("ThreadGroup.scheduler")) {
                b2 = b2.replace("</ThreadGroup>",
                        "  <boolProp name=\"ThreadGroup.scheduler\">true</boolProp>\n</ThreadGroup>");
            }
            // duration (longProp / stringProp)
            b2 = b2.replaceAll(
                "<longProp\\s+name=\"ThreadGroup\\.duration\">[^<]*</longProp>",
                "<longProp name=\"ThreadGroup.duration\">" + d + "</longProp>");
            b2 = b2.replaceAll(
                "<stringProp\\s+name=\"ThreadGroup\\.duration\">[^<]*</stringProp>",
                "<stringProp name=\"ThreadGroup.duration\">" + d + "</stringProp>");
            if (!b2.contains("ThreadGroup.duration")) {
                b2 = b2.replace("</ThreadGroup>",
                        "  <stringProp name=\"ThreadGroup.duration\">" + d + "</stringProp>\n</ThreadGroup>");
            }
            // delay -> 0（可选）
            b2 = b2.replaceAll(
                "<(stringProp|longProp)\\s+name=\"ThreadGroup\\.delay\">[^<]*</(stringProp|longProp)>",
                "<stringProp name=\"ThreadGroup.delay\">0</stringProp>");

            matcher.appendReplacement(sb, Matcher.quoteReplacement(b2));
        }
        matcher.appendTail(sb);

        Files.writeString(dst, sb.toString(), StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        return runtimeRel;
    }

    private void scheduleAutoStop(String executionId, int seconds) {
        CompletableFuture.delayedExecutor(seconds, TimeUnit.SECONDS).execute(() -> {
            try {
                TestExecution exec = runningTests.get(executionId);
                if (exec == null) return;
                TestExecution.TestStatus st = exec.getStatus();
                if (st == TestExecution.TestStatus.RUNNING) {
                    logger.info("达到duration阈值，自动优雅停止测试: {}", executionId);
                    stopTest(executionId);
                } else {
                    logger.info("自动停止跳过，状态为: {} ({})", st, executionId);
                }
            } catch (Exception e) {
                logger.warn("自动停止执行异常: {}", e.getMessage());
            }
        });
    }

    private String createAndStartContainer(TestExecutionRequest request, String executionId, String outputDir, String jmxRel) {
        String containerName = appConfig.getJmeter().getContainerNamePrefix() + "-" + executionId;

        // 构建JMeter命令
        List<String> command = buildJMeterCommand(request, outputDir, jmxRel);
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

    private List<String> buildJMeterCommand(TestExecutionRequest request, String outputDir, String jmxRel) {
        List<String> command = new ArrayList<>();
        // 不要添加 "jmeter"；justb4/jmeter 镜像的 ENTRYPOINT 已是 jmeter
        command.add("-n"); // 非GUI模式
        command.add("-t");
        command.add("/data/" + jmxRel);
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
        if (request.getDuration() != null && request.getDuration() > 0) {
            command.add("-Jduration=" + request.getDuration());
        } else if (request.getTimeout() > 0) {
            // 兼容旧脚本：未指定 duration 时，用 timeout 作为 JMeter 脚本内的 duration 变量
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
        params.put("duration", request.getDuration());
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
        Object lock = reportLocks.computeIfAbsent(execution.getExecutionId(), k -> new Object());
        synchronized (lock) {
            try {
                String resultRel = execution.getResultPath();
                String reportRel = execution.getReportPath();
                if (resultRel == null || reportRel == null) {
                    logger.warn("缺少结果或报告路径，跳过后备报告生成: execId={}", execution.getExecutionId());
                    return;
                }
                File resultFile = new File(appConfig.getDataDir(), resultRel);
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

                // 生成容器名称（唯一）
                String name = appConfig.getJmeter().getContainerNamePrefix() + "-report-" + execution.getExecutionId();

                // 安全创建并等待容器：
                List<String> baseCmd = new ArrayList<>();
                baseCmd.add("-Jjmeter.save.saveservice.output_format=csv");
                baseCmd.add("-Jjmeter.save.saveservice.print_field_names=true");
                baseCmd.add("-Jjmeter.save.saveservice.timestamp_format=ms");
                baseCmd.add("-Jjmeter.save.saveservice.default_delimiter=,");
                baseCmd.add("-f");

                List<String> cmd = new ArrayList<>();
                cmd.add("-g"); cmd.add("/data/" + resultRel);
                cmd.add("-o"); cmd.add("/data/" + reportRel);
                cmd.addAll(baseCmd);

                logger.info("启动后备报告生成容器: {} -> {}", name, String.join(" ", cmd));
                CreateContainerResponse c;
                try {
                    c = dockerClient.createContainerCmd(appConfig.getJmeter().getImage())
                            .withName(name)
                            .withCmd(cmd)
                            .withHostConfig(HostConfig.newHostConfig()
                                    .withBinds(Bind.parse(appConfig.getJmeter().getHostDataDir() + ":/data"))
                                    .withAutoRemove(false))
                            .withWorkingDir("/data")
                            .exec();
                } catch (com.github.dockerjava.api.exception.ConflictException conflict) {
                    logger.warn("发现同名报告容器正在运行，等待其完成: {}", name);
                    try {
                        String containerId = dockerClient.listContainersCmd().withShowAll(true).exec().stream()
                                .filter(ci -> Arrays.asList(ci.getNames()).contains("/" + name))
                                .map(ci -> ci.getId()).findFirst().orElse(null);
                        if (containerId != null) {
                            try { dockerClient.waitContainerCmd(containerId).start().awaitStatusCode(); } catch (Exception ignore) {}
                            logger.info("已有报告容器执行完成: {}", name);
                        } else {
                            logger.warn("同名容器未查询到ID，可能已退出");
                        }
                    } catch (Exception e2) {
                        logger.warn("等待同名报告容器完成时异常: {}", e2.getMessage());
                    }
                    return; // 让先启动的容器负责生成，当前调用直接返回
                }

                dockerClient.startContainerCmd(c.getId()).exec();
                int rc = dockerClient.waitContainerCmd(c.getId()).start().awaitStatusCode();
                if (rc == 0) {
                    logger.info("后备报告生成成功: {}", reportDir.getAbsolutePath());
                } else {
                    logger.warn("后备报告生成失败，退出码: {}", rc);

                    // 如果失败且可能是列不匹配，尝试自动清洗并重试
                    String logs = tryFetchLogs(c.getId());
                    if (logs != null && logs.contains("Mismatch between expected number of columns")) {
                        File cleaned = new File(resultFile.getParentFile(), "results.cleaned.jtl");
                        int[] stats = cleanCsvByColumnCount(resultFile, cleaned);
                        logger.warn("检测到列不匹配，已清洗CSV：保留{}行，丢弃{}行，准备重试生成报告", stats[0], stats[1]);

                        List<String> retryCmd = new ArrayList<>();
                        retryCmd.add("-g"); retryCmd.add("/data/" + resultRel.replace("results.jtl","results.cleaned.jtl"));
                        retryCmd.add("-o"); retryCmd.add("/data/" + reportRel);
                        retryCmd.addAll(baseCmd);

                        String name2 = name + "-retry";
                        logger.info("启动清洗后重试容器: {} -> {}", name2, String.join(" ", retryCmd));
                        CreateContainerResponse c2 = dockerClient.createContainerCmd(appConfig.getJmeter().getImage())
                                .withName(name2)
                                .withCmd(retryCmd)
                                .withHostConfig(HostConfig.newHostConfig()
                                        .withBinds(Bind.parse(appConfig.getJmeter().getHostDataDir() + ":/data"))
                                        .withAutoRemove(false))
                                .withWorkingDir("/data")
                                .exec();
                        dockerClient.startContainerCmd(c2.getId()).exec();
                        int rc2 = dockerClient.waitContainerCmd(c2.getId()).start().awaitStatusCode();
                        if (rc2 == 0) {
                            logger.info("清洗后重试生成报告成功: {}", reportDir.getAbsolutePath());
                            try { cleaned.delete(); } catch (Exception ignore) {}
                        } else {
                            logger.error("清洗后重试仍失败，退出码: {}", rc2);
                        }
                    }
                }
            } catch (Exception ex) {
                logger.error("后备报告生成异常", ex);
            }
        }
    }

    // 读取容器日志的一个小工具方法
    private String tryFetchLogs(String containerId) {
        try {
            StringBuilder sb = new StringBuilder();
            dockerClient.logContainerCmd(containerId).withStdOut(true).withStdErr(true).withTail(500)
                    .exec(new com.github.dockerjava.core.command.LogContainerResultCallback() {
                        @Override public void onNext(com.github.dockerjava.api.model.Frame item) {
                            sb.append(new String(item.getPayload()));
                        }
                    }).awaitCompletion();
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    // 清洗 CSV：按表头列数保留，列数不一致的行丢弃
    // 返回 [kept, dropped]
    private int[] cleanCsvByColumnCount(File src, File dst) {
        int kept = 0, dropped = 0;
        try (BufferedReader br = new BufferedReader(new FileReader(src));
             BufferedWriter bw = new BufferedWriter(new FileWriter(dst))) {
            String header = br.readLine();
            if (header == null) return new int[]{0,0};
            bw.write(header); bw.newLine();
            int expected = splitCsv(header).size();
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) { dropped++; continue; }
                List<String> cols = splitCsv(line);
                if (cols.size() == expected) { bw.write(line); bw.newLine(); kept++; }
                else { dropped++; }
            }
        } catch (Exception e) {
            logger.error("清洗CSV失败", e);
        }
        return new int[]{kept, dropped};
    }

    // 简易 CSV 解析：支持引号包裹和转义的逗号
    private List<String> splitCsv(String line) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuote = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                if (inQuote && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    // 转义双引号
                    cur.append('"'); i++; continue;
                }
                inQuote = !inQuote;
            } else if (ch == ',' && !inQuote) {
                out.add(cur.toString()); cur.setLength(0);
            } else {
                cur.append(ch);
            }
        }
        out.add(cur.toString());
        return out;
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
                    Thread.sleep(15000);
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
