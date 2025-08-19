package com.example.lt.controller;

import com.example.lt.model.ApiResponse;
import com.example.lt.model.MetricsSnapshot;
import com.example.lt.service.RealtimeMetricsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = "*")
public class MetricsController {

    @Autowired private RealtimeMetricsService metricsService;

    @GetMapping("/{executionId}")
    public ResponseEntity<ApiResponse<MetricsSnapshot>> getOnce(@PathVariable String executionId) {
        MetricsSnapshot s = metricsService.getSnapshot(executionId);
        if (s == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.success("OK", s));
    }

    @GetMapping(path = "/stream/{executionId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable String executionId) {
        SseEmitter emitter = new SseEmitter(0L); // no timeout
        final long[] lastSent = {0};
        final boolean[] running = {true};

        Runnable task = () -> {
            try {
                while (running[0]) {
                    MetricsSnapshot s = metricsService.getSnapshot(executionId);
                    if (s != null && s.getTimestamp() != lastSent[0]) {
                        lastSent[0] = s.getTimestamp();
                        try { emitter.send(s); } catch (Exception ignore) {}
                    }
                    Thread.sleep(1000);
                }
            } catch (InterruptedException ignored) {
            } finally {
                emitter.complete();
            }
        };
        Thread t = new Thread(task, "sse-" + executionId);
        t.setDaemon(true);
        t.start();
        emitter.onCompletion(() -> running[0] = false);
        emitter.onTimeout(() -> running[0] = false);
        return emitter;
    }
}

