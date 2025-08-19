package com.example.lt.controller;

import com.example.lt.model.ApiResponse;
import com.example.lt.model.FileUploadResult;
import com.example.lt.service.FileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileUploadController {
    private static final Logger logger = LoggerFactory.getLogger(FileUploadController.class);

    @Autowired
    private FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileUploadResult>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", defaultValue = "misc") String category) {
        
        try {
            logger.info("接收文件上传请求: {}, 分类: {}", file.getOriginalFilename(), category);
            
            FileUploadResult result = fileService.uploadFile(file, category);
            return ResponseEntity.ok(ApiResponse.success("文件上传成功", result));
            
        } catch (IllegalArgumentException e) {
            logger.warn("文件上传参数错误: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("参数错误: " + e.getMessage()));
                
        } catch (Exception e) {
            logger.error("文件上传失败", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("文件上传失败: " + e.getMessage()));
        }
    }

    @PostMapping("/upload/testplan")
    public ResponseEntity<ApiResponse<FileUploadResult>> uploadTestPlan(
            @RequestParam("file") MultipartFile file) {
        
        try {
            logger.info("接收JMeter测试计划上传: {}", file.getOriginalFilename());
            
            // 验证是否为JMX文件
            String fileName = file.getOriginalFilename();
            if (fileName == null || !fileName.toLowerCase().endsWith(".jmx")) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("请上传JMeter测试计划文件(.jmx)"));
            }
            
            FileUploadResult result = fileService.uploadFile(file, "testplan");
            return ResponseEntity.ok(ApiResponse.success("测试计划上传成功", result));
            
        } catch (Exception e) {
            logger.error("测试计划上传失败", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("测试计划上传失败: " + e.getMessage()));
        }
    }

    @PostMapping("/upload/data")
    public ResponseEntity<ApiResponse<FileUploadResult>> uploadTestData(
            @RequestParam("file") MultipartFile file) {
        
        try {
            logger.info("接收测试数据文件上传: {}", file.getOriginalFilename());
            
            FileUploadResult result = fileService.uploadFile(file, "data");
            return ResponseEntity.ok(ApiResponse.success("测试数据上传成功", result));
            
        } catch (Exception e) {
            logger.error("测试数据上传失败", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("测试数据上传失败: " + e.getMessage()));
        }
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<Map<String, List<File>>>> listFiles() {
        try {
            Map<String, List<File>> fileMap = new HashMap<>();
            fileMap.put("testplans", fileService.listFiles("uploads/testplans"));
            fileMap.put("data", fileService.listFiles("uploads/data"));
            fileMap.put("misc", fileService.listFiles("uploads/misc"));
            
            return ResponseEntity.ok(ApiResponse.success("文件列表获取成功", fileMap));
            
        } catch (Exception e) {
            logger.error("获取文件列表失败", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("获取文件列表失败: " + e.getMessage()));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<Boolean>> deleteFile(@RequestParam("filePath") String filePath) {
        try {
            boolean deleted = fileService.deleteFile(filePath);
            if (deleted) {
                return ResponseEntity.ok(ApiResponse.success("文件删除成功", true));
            } else {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("文件不存在或删除失败"));
            }
            
        } catch (Exception e) {
            logger.error("删除文件失败", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("删除文件失败: " + e.getMessage()));
        }
    }
}
