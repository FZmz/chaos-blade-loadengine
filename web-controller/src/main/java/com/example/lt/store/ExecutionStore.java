package com.example.lt.store;

import com.example.lt.model.ExecutionEvent;
import com.example.lt.model.ExecutionSummary;
import com.example.lt.model.TestExecution;

import java.util.List;

public interface ExecutionStore {
    void saveOrUpdate(TestExecution ex);
    void appendEvent(String id, ExecutionEvent evt);
    List<String> tailEvents(String id, int tail);
    TestExecution findById(String id);
    List<TestExecution> list(int page, int size);
    void saveSummary(String id, ExecutionSummary summary);
    ExecutionSummary loadSummary(String id);
}

