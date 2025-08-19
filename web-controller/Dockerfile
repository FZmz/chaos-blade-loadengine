
# 构建阶段
FROM eclipse-temurin:11-jdk-jammy AS builder

# 替换apt源为中科大镜像源
RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/security.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's|http://mirrors.ustc.edu.cn/debian-security|https://mirrors.ustc.edu.cn/debian-security|g' /etc/apt/sources.list

# 安装Maven
RUN apt-get update && \
    apt-get install -y maven && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制Maven配置文件
COPY settings.xml /root/.m2/settings.xml

# 复制pom.xml并下载依赖（利用Docker缓存层）
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 复制源代码并构建
COPY src ./src
RUN mvn clean package -DskipTests -B

# 运行阶段
FROM eclipse-temurin:11-jre-jammy

# 替换apt源为中科大镜像源
RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's/security.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list && \
    sed -i 's|http://mirrors.ustc.edu.cn/debian-security|https://mirrors.ustc.edu.cn/debian-security|g' /etc/apt/sources.list

# 安装Docker CLI
RUN apt-get update && \
    apt-get install -y curl gnupg2 software-properties-common lsb-release && \
    curl -fsSL https://mirrors.ustc.edu.cn/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.ustc.edu.cn/docker-ce/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 从构建阶段复制JAR文件
COPY --from=builder /app/target/loadtest-controller-1.0.0.jar app.jar

#  创建非root用户
# RUN groupadd -r appuser && useradd -r -g appuser appuser && \
#     chown -R appuser:appuser /app

# USER appuser

# 运行应用
EXPOSE 8080
CMD ["/bin/sh","-c","mkdir -p /data/uploads/testplans /data/uploads/data /data/uploads/misc && chmod -R 0777 /data/uploads || true; exec java -jar app.jar"]
