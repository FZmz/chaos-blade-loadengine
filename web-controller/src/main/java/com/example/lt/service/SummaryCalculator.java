package com.example.lt.service;

import com.example.lt.model.ExecutionSummary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

public class SummaryCalculator {
    private static final Logger log = LoggerFactory.getLogger(SummaryCalculator.class);

    public static ExecutionSummary compute(File jtl) {
        ExecutionSummary s = new ExecutionSummary();
        s.minRt = Long.MAX_VALUE;
        if (jtl == null || !jtl.exists() || jtl.length() == 0) {
            return s;
        }
        try (BufferedReader br = new BufferedReader(new FileReader(jtl))) {
            String line;
            boolean headerParsed = false;
            int idxElapsed = 1; // default
            int idxSuccess = 7; // default
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                if (!headerParsed) {
                    String ll = line.toLowerCase();
                    if (ll.contains("timestamp") && ll.contains("elapsed")) {
                        String[] cols = line.split(",");
                        for (int i = 0; i < cols.length; i++) {
                            String c = cols[i].trim().toLowerCase();
                            if (c.equals("elapsed")) idxElapsed = i;
                            if (c.equals("success")) idxSuccess = i;
                        }
                        headerParsed = true;
                        continue;
                    } else {
                        headerParsed = true; // no header
                    }
                }
                String[] arr = line.split(",");
                try {
                    long elapsed = parseLong(arr, idxElapsed);
                    boolean success = parseBool(arr, idxSuccess);
                    s.total++;
                    if (success) s.succ++; else s.err++;
                    s.avgRt += elapsed; // temp keep sum
                    if (elapsed > s.maxRt) s.maxRt = elapsed;
                    if (elapsed < s.minRt) s.minRt = elapsed;
                } catch (Exception ignore) {}
            }
            if (s.total > 0) {
                s.avgRt = s.avgRt / s.total;
            } else {
                s.minRt = 0; s.maxRt = 0; s.avgRt = 0;
            }
        } catch (Exception e) {
            log.warn("compute summary failed: {}", e.getMessage());
        }
        return s;
    }

    private static long parseLong(String[] arr, int idx) {
        if (idx < 0 || idx >= arr.length) return 0;
        try { return Long.parseLong(arr[idx].trim()); } catch (Exception e) { return 0; }
    }
    private static boolean parseBool(String[] arr, int idx) {
        if (idx < 0 || idx >= arr.length) return false;
        return "true".equalsIgnoreCase(arr[idx].trim());
    }
}

