package com.example.lt.service;

import com.example.lt.config.AppConfig;
import com.example.lt.model.MetricsSnapshot;
import com.example.lt.model.TestExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tail JTL(csv) files and compute rolling metrics for real-time monitoring.
 */
@Service
public class RealtimeMetricsService {
    private static final Logger log = LoggerFactory.getLogger(RealtimeMetricsService.class);

    @Autowired private AppConfig appConfig;
    @Autowired private JMeterService jmeterService;

    private static class TailState {
        long lastOffset = 0L;
        boolean headerParsed = false;
        int idxTs = 0;
        int idxElapsed = 1;
        int idxSuccess = 7;
        int idxAllThreads = 9; // default aligns with JMeter CSV
        // rolling window for throughput (timestamps in ms)
        Deque<Long> recentTimestamps = new ArrayDeque<>();
        long totalCount = 0;
        long succ = 0;
        long err = 0;
        long sumRt = 0;
        long maxRt = Long.MIN_VALUE;
        long minRt = Long.MAX_VALUE;
        long activeThreads = 0; // from JTL if present; else estimate
    }

    private final Map<String, TailState> states = new ConcurrentHashMap<>();

    public MetricsSnapshot getSnapshot(String executionId) {
        TestExecution ex = jmeterService.getTestExecution(executionId);
        if (ex == null || ex.getResultPath() == null) return null;
        File jtl = new File(appConfig.getDataDir(), ex.getResultPath());
        TailState s = states.computeIfAbsent(executionId, k -> new TailState());

        try (FileInputStream fis = new FileInputStream(jtl)) {
            long skip = s.lastOffset;
            if (skip > 0) {
                long skipped = fis.skip(skip);
                if (skipped != skip) {
                    // file rotated or truncated; reset
                    s.lastOffset = 0;
                }
            }
            InputStreamReader isr = new InputStreamReader(fis, StandardCharsets.UTF_8);
            BufferedReader br = new BufferedReader(isr);
            String line;
            boolean firstLine = s.lastOffset == 0 && !s.headerParsed;
            while ((line = br.readLine()) != null) {
                s.lastOffset += (line.getBytes(StandardCharsets.UTF_8).length + 1); // rough
                if (firstLine) {
                    firstLine = false;
                    if (line.toLowerCase().contains("timestamp") && line.toLowerCase().contains("elapsed")) {
                        parseHeader(line, s);
                        s.headerParsed = true;
                        continue; // do not treat header as data
                    } else {
                        // no header line; mark parsed to avoid re-check
                        s.headerParsed = true;
                    }
                }
                if (line.trim().isEmpty()) continue;
                parseOne(line, s);
            }
        } catch (Exception e) {
            // ignore when file not ready
            return null;
        }

        long now = System.currentTimeMillis();
        // purge old timestamps beyond 5s window for throughput
        long windowMs = 5000L;
        while (!s.recentTimestamps.isEmpty() && now - s.recentTimestamps.peekFirst() > windowMs) {
            s.recentTimestamps.pollFirst();
        }

        MetricsSnapshot m = new MetricsSnapshot();
        m.setExecutionId(executionId);
        m.setTimestamp(now);
        m.setActiveThreads(s.activeThreads);
        m.setTotalRequests(s.totalCount);
        m.setSuccessCount(s.succ);
        m.setErrorCount(s.err);
        long cnt = Math.max(1, s.totalCount);
        m.setAvgResponseTime((double) s.sumRt / cnt);
        m.setMaxResponseTime(s.maxRt == Long.MIN_VALUE ? 0 : s.maxRt);
        m.setMinResponseTime(s.minRt == Long.MAX_VALUE ? 0 : s.minRt);
        m.setErrorRate(s.totalCount == 0 ? 0.0 : (double) s.err / s.totalCount);
        m.setThroughput(s.recentTimestamps.size() / (windowMs / 1000.0));
        return m;
    }

    private void parseHeader(String line, TailState s) {
        String[] cols = line.split(",");
        for (int i = 0; i < cols.length; i++) {
            String c = cols[i].trim();
            String lc = c.toLowerCase();
            if (lc.equals("timestamp") || lc.equals("timeStamp".toLowerCase())) s.idxTs = i;
            if (lc.equals("elapsed")) s.idxElapsed = i;
            if (lc.equals("success")) s.idxSuccess = i;
            if (lc.equals("allthreads")) s.idxAllThreads = i;
        }
    }

    private void parseOne(String line, TailState s) {
        String[] arr = line.split(",");
        try {
            long elapsed = parseLongSafe(arr, s.idxElapsed);
            boolean success = parseBoolSafe(arr, s.idxSuccess);
            long allThreads = parseLongSafe(arr, s.idxAllThreads);
            long ts = parseLongSafe(arr, s.idxTs);
            s.totalCount++;
            if (success) s.succ++; else s.err++;
            s.sumRt += elapsed;
            s.maxRt = Math.max(s.maxRt, elapsed);
            s.minRt = Math.min(s.minRt, elapsed);
            if (allThreads > 0) s.activeThreads = allThreads;
            if (ts > 0) s.recentTimestamps.addLast(ts);
        } catch (Exception ignore) {}
    }

    private long parseLongSafe(String[] arr, int idx) {
        if (idx < 0 || idx >= arr.length) return 0;
        try { return Long.parseLong(arr[idx].trim()); } catch (Exception e) { return 0; }
    }
    private boolean parseBoolSafe(String[] arr, int idx) {
        if (idx < 0 || idx >= arr.length) return false;
        return "true".equalsIgnoreCase(arr[idx].trim());
    }
}