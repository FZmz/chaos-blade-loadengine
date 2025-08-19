package com.example.lt.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
public class AppConfig {
    private String dataDir = "/data";
    private String basePublicUrl = "http://1.94.151.57";
    private JMeterConfig jmeter = new JMeterConfig();

    public static class JMeterConfig {
        private String image = "justb4/jmeter:5.6.3";
        private String hostDataDir = "/tmp/loadtest-data";
        private String containerNamePrefix = "jmeter-test";
        private String defaultHeapSize = "1g";
        private int defaultTimeout = 3600;

        // Getters and Setters
        public String getImage() { return image; }
        public void setImage(String image) { this.image = image; }
        
        public String getHostDataDir() { return hostDataDir; }
        public void setHostDataDir(String hostDataDir) { this.hostDataDir = hostDataDir; }
        
        public String getContainerNamePrefix() { return containerNamePrefix; }
        public void setContainerNamePrefix(String containerNamePrefix) { this.containerNamePrefix = containerNamePrefix; }
        
        public String getDefaultHeapSize() { return defaultHeapSize; }
        public void setDefaultHeapSize(String defaultHeapSize) { this.defaultHeapSize = defaultHeapSize; }
        
        public int getDefaultTimeout() { return defaultTimeout; }
        public void setDefaultTimeout(int defaultTimeout) { this.defaultTimeout = defaultTimeout; }
    }

    // Getters and Setters
    public String getDataDir() { return dataDir; }
    public void setDataDir(String dataDir) { this.dataDir = dataDir; }
    
    public String getBasePublicUrl() { return basePublicUrl; }
    public void setBasePublicUrl(String basePublicUrl) { this.basePublicUrl = basePublicUrl; }
    
    public JMeterConfig getJmeter() { return jmeter; }
    public void setJmeter(JMeterConfig jmeter) { this.jmeter = jmeter; }
}
