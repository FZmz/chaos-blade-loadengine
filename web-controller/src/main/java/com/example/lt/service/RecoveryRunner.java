package com.example.lt.service;

import com.example.lt.config.AppConfig;
import com.example.lt.model.ExecutionEvent;
import com.example.lt.model.ExecutionSummary;
import com.example.lt.model.TestExecution;
import com.example.lt.store.ExecutionStore;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Container;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class RecoveryRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(RecoveryRunner.class);

    @Autowired private JMeterService jmeterService;
    @Autowired private ExecutionStore store;
    @Autowired private AppConfig appConfig;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        // 1) 若 executions 目录为空，尝试从 results 目录补录历史
        Path execRoot = Paths.get(appConfig.getExecutionsDir());
        try { Files.createDirectories(execRoot); } catch (Exception ignore) {}
        boolean empty = Files.list(execRoot).findAny().isEmpty();
        if (empty) {
            migrateFromResults();
        }

        // 2) 加载所有记录，针对 RUNNING 状态进行对账
        List<TestExecution> all = store.list(0, 10000);
        for (TestExecution ex : all) {
            if (ex.getStatus() == TestExecution.TestStatus.RUNNING) {
                reconcile(ex);
            }
        }
        log.info("Recovery complete: {} records", all.size());
    }

    private void migrateFromResults() {
        try {
            Path results = Paths.get(appConfig.getDataDir(), "results");
            if (!Files.exists(results)) return;
            List<Path> dirs = Files.list(results).filter(Files::isDirectory).collect(Collectors.toList());
            for (Path d : dirs) {
                String name = d.getFileName().toString();
                String[] parts = name.split("_");
                if (parts.length < 2) continue;
                String ts = parts[0] + "_" + parts[1];
                String execId = parts[parts.length - 1];
                TestExecution ex = new TestExecution(execId, "Recovered", "");
                try {
                    LocalDateTime st = LocalDateTime.parse(ts, DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
                    ex.setStartTime(st);
                } catch (Exception ignore) {}
                ex.setResultPath("results/" + name + "/results.jtl");
                ex.setReportPath("reports/" + name);
                ex.setLogPath("results/" + name + "/jmeter.log");
                File jtl = new File(appConfig.getDataDir(), ex.getResultPath());
                File reportIdx = new File(appConfig.getDataDir(), ex.getReportPath() + "/index.html");
                if (jtl.exists() && jtl.length() > 0 && reportIdx.exists()) {
                    ex.setStatus(TestExecution.TestStatus.COMPLETED);
                } else if (jtl.exists() && jtl.length() > 0) {
                    ex.setStatus(TestExecution.TestStatus.COMPLETED); // 报告缺失也视作完成
                } else {
                    ex.setStatus(TestExecution.TestStatus.FAILED);
                }
                ex.setEndTime(LocalDateTime.now());
                store.saveOrUpdate(ex);
                store.appendEvent(execId, new ExecutionEvent("MIGRATED", name));
                if (jtl.exists() && jtl.length() > 0) {
                    ExecutionSummary sum = SummaryCalculator.compute(jtl);
                    store.saveSummary(execId, sum);
                }
            }
            log.info("Migration from results completed: {} dirs", dirs.size());
        } catch (Exception e) {
            log.warn("Migration failed: {}", e.getMessage());
        }
    }

    private void reconcile(TestExecution ex) {
        try {
            DockerClient cli = jmeterService == null ? null : (DockerClient)JMeterService.class.getDeclaredField("dockerClient").get(jmeterService);
        } catch (Exception ignore) {}
        try {
            // 简化处理：查询容器名是否存在
            List<Container> containers = jmeterService == null ? List.of() : jmeterService.getAllTestExecutions().stream()
                    .filter(e -> e.getExecutionId().equals(ex.getExecutionId())).map(e -> (Container)null).collect(Collectors.toList());
            // 无法直接拿到 DockerClient 进行列表（其为 private），采用保守策略：若结果文件存在则视为完成
            File jtl = new File(appConfig.getDataDir(), ex.getResultPath());
            if (jtl.exists() && jtl.length() > 0) {
                ex.setStatus(TestExecution.TestStatus.COMPLETED);
                ex.setEndTime(LocalDateTime.now());
                store.saveOrUpdate(ex);
                store.appendEvent(ex.getExecutionId(), new ExecutionEvent("RECOVERED_COMPLETED", "by-file"));
                ExecutionSummary sum = SummaryCalculator.compute(jtl);
                store.saveSummary(ex.getExecutionId(), sum);
            } else {
                ex.setStatus(TestExecution.TestStatus.FAILED);
                ex.setEndTime(LocalDateTime.now());
                store.saveOrUpdate(ex);
                store.appendEvent(ex.getExecutionId(), new ExecutionEvent("RECOVERED_FAILED", "no-output"));
            }
        } catch (Exception e) {
            log.warn("Reconcile failed for {}: {}", ex.getExecutionId(), e.getMessage());
        }
    }
}

