#!/bin/bash

# Docker构建测试脚本

set -e

echo "=== Docker构建测试 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker未运行，请启动Docker服务${NC}"
    exit 1
fi

echo -e "${BLUE}📋 当前Docker版本:${NC}"
docker --version

echo -e "\n${YELLOW}🔧 开始构建web-controller镜像...${NC}"
echo "使用中科大镜像源和阿里云Maven仓库"

# 记录开始时间
start_time=$(date +%s)

# 构建镜像
cd web-controller
if docker build -t loadtest-web:latest .; then
    echo -e "\n${GREEN}✅ 镜像构建成功！${NC}"
else
    echo -e "\n${RED}❌ 镜像构建失败${NC}"
    exit 1
fi

# 记录结束时间
end_time=$(date +%s)
duration=$((end_time - start_time))

echo -e "\n${BLUE}📊 构建统计:${NC}"
echo "构建时间: ${duration}秒"

# 显示镜像信息
echo -e "\n${BLUE}📋 镜像信息:${NC}"
docker images loadtest-web:latest

# 显示镜像大小
image_size=$(docker images loadtest-web:latest --format "{{.Size}}")
echo "镜像大小: $image_size"

# 检查镜像层数
echo -e "\n${BLUE}📋 镜像层信息:${NC}"
docker history loadtest-web:latest --no-trunc

echo -e "\n${YELLOW}🧪 测试镜像启动...${NC}"

# 测试容器启动
container_id=$(docker run -d --name loadtest-web-test \
    -e DATA_DIR=/data \
    -e BASE_PUBLIC_URL=http://localhost \
    -e JMETER_IMAGE=justb4/jmeter:latest \
    -e HOST_DATA_DIR=/tmp/test-data \
    loadtest-web:latest)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 容器启动成功，容器ID: $container_id${NC}"
    
    # 等待应用启动
    echo "等待应用启动..."
    sleep 10
    
    # 检查容器状态
    if docker ps | grep -q loadtest-web-test; then
        echo -e "${GREEN}✅ 容器运行正常${NC}"
        
        # 检查应用日志
        echo -e "\n${BLUE}📋 应用启动日志:${NC}"
        docker logs loadtest-web-test | tail -20
        
        # 检查端口
        echo -e "\n${BLUE}📋 容器端口信息:${NC}"
        docker port loadtest-web-test
        
    else
        echo -e "${RED}❌ 容器启动后异常退出${NC}"
        echo -e "\n${BLUE}📋 容器日志:${NC}"
        docker logs loadtest-web-test
    fi
    
    # 清理测试容器
    echo -e "\n${YELLOW}🧹 清理测试容器...${NC}"
    docker stop loadtest-web-test > /dev/null 2>&1
    docker rm loadtest-web-test > /dev/null 2>&1
    echo -e "${GREEN}✅ 测试容器已清理${NC}"
    
else
    echo -e "${RED}❌ 容器启动失败${NC}"
    exit 1
fi

cd ..

echo -e "\n${GREEN}🎉 Docker构建测试完成！${NC}"
echo -e "\n${BLUE}💡 优化效果:${NC}"
echo "✅ 使用中科大APT镜像源，加速软件包下载"
echo "✅ 使用阿里云Maven仓库，加速依赖下载"
echo "✅ 使用多阶段构建，减少最终镜像大小"
echo "✅ 使用Docker缓存层，提高重复构建速度"
echo "✅ 使用非root用户运行，提高安全性"

echo -e "\n${YELLOW}📝 下一步:${NC}"
echo "1. 运行 ./start.sh 启动完整系统"
echo "2. 运行 ./test-api.sh 测试API功能"
