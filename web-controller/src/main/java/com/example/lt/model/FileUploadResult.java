package com.example.lt.model;

public class FileUploadResult {
    private String fileName;
    private String originalFileName;
    private String fileType;
    private long fileSize;
    private String uploadPath;
    private String accessUrl;
    private long uploadTime;

    public FileUploadResult() {}

    public FileUploadResult(String fileName, String originalFileName, String fileType, 
                           long fileSize, String uploadPath, String accessUrl) {
        this.fileName = fileName;
        this.originalFileName = originalFileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.uploadPath = uploadPath;
        this.accessUrl = accessUrl;
        this.uploadTime = System.currentTimeMillis();
    }

    // Getters and Setters
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    
    public String getUploadPath() { return uploadPath; }
    public void setUploadPath(String uploadPath) { this.uploadPath = uploadPath; }
    
    public String getAccessUrl() { return accessUrl; }
    public void setAccessUrl(String accessUrl) { this.accessUrl = accessUrl; }
    
    public long getUploadTime() { return uploadTime; }
    public void setUploadTime(long uploadTime) { this.uploadTime = uploadTime; }
}
