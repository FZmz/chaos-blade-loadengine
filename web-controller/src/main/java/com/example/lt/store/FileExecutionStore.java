package com.example.lt.store;

import com.example.lt.config.AppConfig;
import com.example.lt.model.ExecutionEvent;
import com.example.lt.model.ExecutionSummary;
import com.example.lt.model.TestExecution;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FileExecutionStore implements ExecutionStore {
    private static final Logger log = LoggerFactory.getLogger(FileExecutionStore.class);

    private final Path root;
    private final ObjectMapper om;

    @Autowired
    public FileExecutionStore(AppConfig cfg) {
        this.root = Paths.get(cfg.getExecutionsDir());
        try { Files.createDirectories(this.root); } catch (IOException ignored) {}
        this.om = new ObjectMapper();
        this.om.registerModule(new JavaTimeModule());
        this.om.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    private Path dirOf(String id) { return root.resolve(id); }
    private Path execJson(String id) { return dirOf(id).resolve("execution.json"); }
    private Path eventsFile(String id) { return dirOf(id).resolve("events.jsonl"); }
    private Path summaryJson(String id) { return dirOf(id).resolve("summary.json"); }

    @Override
    public void saveOrUpdate(TestExecution ex) {
        String id = ex.getExecutionId();
        Path dir = dirOf(id);
        try { Files.createDirectories(dir); } catch (IOException ignored) {}
        Path tmp = dir.resolve("execution.json.tmp");
        Path dst = execJson(id);
        try {
            String json = om.writeValueAsString(ex);
            Files.write(tmp, json.getBytes(StandardCharsets.UTF_8));
            Files.move(tmp, dst, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (Exception e) {
            log.error("saveOrUpdate failed for {}", id, e);
            try { Files.deleteIfExists(tmp); } catch (Exception ignore) {}
        }
    }

    @Override
    public void appendEvent(String id, ExecutionEvent evt) {
        Path dir = dirOf(id);
        try { Files.createDirectories(dir); } catch (IOException ignored) {}
        Path f = eventsFile(id);
        try (BufferedWriter bw = Files.newBufferedWriter(f, StandardCharsets.UTF_8,
                java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND)) {
            String line = om.writeValueAsString(evt);
            bw.write(line);
            bw.newLine();
        } catch (Exception e) {
            log.warn("appendEvent failed for {}: {}", id, e.getMessage());
        }
    }

    @Override
    public List<String> tailEvents(String id, int tail) {
        Path f = eventsFile(id);
        if (!Files.exists(f)) return List.of();
        if (tail <= 0) tail = 100;
        Deque<String> dq = new ArrayDeque<>(tail);
        try (BufferedReader br = Files.newBufferedReader(f, StandardCharsets.UTF_8)) {
            String line;
            while ((line = br.readLine()) != null) {
                if (dq.size() == tail) dq.pollFirst();
                dq.addLast(line);
            }
        } catch (Exception e) {
            log.warn("tailEvents failed: {}", e.getMessage());
        }
        return new ArrayList<>(dq);
    }

    @Override
    public TestExecution findById(String id) {
        Path f = execJson(id);
        if (!Files.exists(f)) return null;
        try {
            byte[] b = Files.readAllBytes(f);
            return om.readValue(b, TestExecution.class);
        } catch (Exception e) {
            log.warn("findById read error {}: {}", id, e.getMessage());
            return null;
        }
    }

    @Override
    public List<TestExecution> list(int page, int size) {
        if (size <= 0) size = 100;
        if (page < 0) page = 0;
        try {
            List<TestExecution> all = Files.list(root)
                .filter(Files::isDirectory)
                .map(p -> p.getFileName().toString())
                .map(this::findById)
                .filter(e -> e != null)
                .sorted(Comparator.comparing(TestExecution::getStartTime, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .collect(Collectors.toList());
            int from = Math.min(page * size, all.size());
            int to = Math.min(from + size, all.size());
            return new ArrayList<>(all.subList(from, to));
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    @Override
    public void saveSummary(String id, ExecutionSummary summary) {
        Path dir = dirOf(id);
        try { Files.createDirectories(dir); } catch (IOException ignored) {}
        Path tmp = dir.resolve("summary.json.tmp");
        Path dst = summaryJson(id);
        try {
            String json = om.writeValueAsString(summary);
            Files.write(tmp, json.getBytes(StandardCharsets.UTF_8));
            Files.move(tmp, dst, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (Exception e) {
            log.error("saveSummary failed for {}", id, e);
            try { Files.deleteIfExists(tmp); } catch (Exception ignore) {}
        }
    }

    @Override
    public ExecutionSummary loadSummary(String id) {
        Path f = summaryJson(id);
        if (!Files.exists(f)) return null;
        try {
            byte[] b = Files.readAllBytes(f);
            return om.readValue(b, ExecutionSummary.class);
        } catch (Exception e) {
            log.warn("loadSummary failed {}: {}", id, e.getMessage());
            return null;
        }
    }
}

