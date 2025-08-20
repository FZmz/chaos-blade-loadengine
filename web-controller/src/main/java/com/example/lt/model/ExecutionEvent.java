package com.example.lt.model;

public class ExecutionEvent {
    public long ts;
    public String type;
    public String message;

    public ExecutionEvent() {
    }

    public ExecutionEvent(String type, String message) {
        this.ts = System.currentTimeMillis();
        this.type = type;
        this.message = message;
    }
}

