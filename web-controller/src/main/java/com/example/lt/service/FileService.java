package com.example.lt.service;

import com.example.lt.config.AppConfig;
import com.example.lt.model.FileUploadResult;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileService {
    private static final Logger logger = LoggerFactory.getLogger(FileService.class);
    
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
        "jmx", "csv", "txt", "json", "xml", "properties"
    );
    
    private static final long MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

    @Autowired
    private AppConfig appConfig;

    public FileUploadResult uploadFile(MultipartFile file, String category) throws IOException {
        validateFile(file);
        
        String originalFileName = file.getOriginalFilename();
        String extension = FilenameUtils.getExtension(originalFileName);
        
        // 生成唯一文件名
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        String fileName = String.format("%s_%s_%s.%s", 
            FilenameUtils.getBaseName(originalFileName), timestamp, uniqueId, extension);
        
        // 确定上传目录
        String uploadDir = determineUploadDir(category);
        Path uploadPath = Paths.get(appConfig.getDataDir(), uploadDir);
        
        // 创建目录
        Files.createDirectories(uploadPath);
        
        // 保存文件
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // 生成访问URL
        String accessUrl = String.format("%s/%s/%s", 
            appConfig.getBasePublicUrl(), uploadDir, fileName);
        
        logger.info("文件上传成功: {} -> {}", originalFileName, filePath);
        
        return new FileUploadResult(
            fileName,
            originalFileName,
            extension,
            file.getSize(),
            filePath.toString(),
            accessUrl
        );
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("文件不能为空");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("文件大小不能超过500MB");
        }
        
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.trim().isEmpty()) {
            throw new IllegalArgumentException("文件名不能为空");
        }
        
        String extension = FilenameUtils.getExtension(originalFileName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("不支持的文件类型: " + extension + 
                "。支持的类型: " + String.join(", ", ALLOWED_EXTENSIONS));
        }
    }

    private String determineUploadDir(String category) {
        if ("testplan".equals(category) || "jmx".equals(category)) {
            return "uploads/testplans";
        } else if ("data".equals(category) || "csv".equals(category)) {
            return "uploads/data";
        } else {
            return "uploads/misc";
        }
    }

    public boolean deleteFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            boolean deleted = Files.deleteIfExists(path);
            if (deleted) {
                logger.info("文件删除成功: {}", filePath);
            } else {
                logger.warn("文件不存在: {}", filePath);
            }
            return deleted;
        } catch (IOException e) {
            logger.error("删除文件失败: {}", filePath, e);
            return false;
        }
    }

    public List<File> listFiles(String directory) {
        Path dirPath = Paths.get(appConfig.getDataDir(), directory);
        File dir = dirPath.toFile();
        
        if (!dir.exists() || !dir.isDirectory()) {
            return Arrays.asList();
        }
        
        File[] files = dir.listFiles();
        return files != null ? Arrays.asList(files) : Arrays.asList();
    }
}
