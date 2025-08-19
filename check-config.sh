#!/bin/bash

# 配置文件一致性检查脚本

set -e

echo "=== 负载测试系统配置检查 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file 存在${NC}"
        return 0
    else
        echo -e "${RED}❌ $file 不存在${NC}"
        return 1
    fi
}

check_config_value() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    if [ -f "$file" ]; then
        local value=$(grep -E "$pattern" "$file" | head -1)
        if [ -n "$value" ]; then
            echo -e "${BLUE}📋 $description:${NC} $value"
        else
            echo -e "${YELLOW}⚠️  $description 未找到匹配项${NC}"
        fi
    fi
}

echo -e "\n${YELLOW}1. 检查必要文件是否存在${NC}"
files=(
    "docker-compose.yml"
    "nginx/nginx.conf"
    "web-controller/src/main/resources/application.yml"
    "web-controller/pom.xml"
    "web-controller/Dockerfile"
    ".env.example"
)

all_files_exist=true
for file in "${files[@]}"; do
    if ! check_file "$file"; then
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    echo -e "\n${RED}❌ 部分必要文件缺失，请检查项目完整性${NC}"
    exit 1
fi

echo -e "\n${YELLOW}2. 检查JMeter镜像版本一致性${NC}"
check_config_value "docker-compose.yml" "JMETER_IMAGE=" "Docker Compose中的JMeter镜像"
check_config_value "web-controller/src/main/resources/application.yml" "image:.*jmeter" "Application.yml中的JMeter镜像"
check_config_value ".env.example" "JMETER_IMAGE=" ".env.example中的JMeter镜像"

echo -e "\n${YELLOW}3. 检查BASE_PUBLIC_URL配置${NC}"
check_config_value "docker-compose.yml" "BASE_PUBLIC_URL=" "Docker Compose中的BASE_PUBLIC_URL"
check_config_value "web-controller/src/main/resources/application.yml" "base-public-url:" "Application.yml中的base-public-url"
check_config_value ".env.example" "BASE_PUBLIC_URL=" ".env.example中的BASE_PUBLIC_URL"

echo -e "\n${YELLOW}4. 检查端口配置${NC}"
check_config_value "docker-compose.yml" "\"80:80\"" "Nginx端口映射"
check_config_value "web-controller/src/main/resources/application.yml" "port:" "Spring Boot端口"
check_config_value "nginx/nginx.conf" "listen 80" "Nginx监听端口"
check_config_value "nginx/nginx.conf" "lt-web:8080" "Nginx代理目标端口"

echo -e "\n${YELLOW}5. 检查数据目录配置${NC}"
check_config_value "docker-compose.yml" "HOST_DATA_DIR" "Docker Compose中的数据目录"
check_config_value "web-controller/src/main/resources/application.yml" "data-dir:" "Application.yml中的数据目录"

echo -e "\n${YELLOW}6. 检查Nginx静态文件配置${NC}"
check_config_value "nginx/nginx.conf" "location /uploads/" "上传文件路径"
check_config_value "nginx/nginx.conf" "location /reports/" "报告文件路径"
check_config_value "nginx/nginx.conf" "location /results/" "结果文件路径"

echo -e "\n${YELLOW}7. 检查Docker配置${NC}"
check_config_value "docker-compose.yml" "version:" "Docker Compose版本"
check_config_value "web-controller/Dockerfile" "FROM openjdk:" "Java基础镜像"

echo -e "\n${YELLOW}8. 检查.env文件${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env 文件存在${NC}"
    check_config_value ".env" "HOST_DATA_DIR=" "实际数据目录配置"
    check_config_value ".env" "BASE_PUBLIC_URL=" "实际公共URL配置"
else
    echo -e "${YELLOW}⚠️  .env 文件不存在，将使用默认配置${NC}"
    echo -e "${BLUE}💡 建议运行: cp .env.example .env${NC}"
fi

echo -e "\n${YELLOW}9. 检查数据目录结构${NC}"
data_dirs=(
    "data"
    "data/uploads"
    "data/uploads/testplans"
    "data/uploads/data"
    "data/uploads/misc"
    "data/results"
    "data/reports"
)

for dir in "${data_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ $dir 目录存在${NC}"
    else
        echo -e "${YELLOW}⚠️  $dir 目录不存在${NC}"
        echo -e "${BLUE}💡 将在启动时自动创建${NC}"
    fi
done

echo -e "\n${YELLOW}10. 检查示例文件${NC}"
if [ -f "examples/sample-test-plan.jmx" ]; then
    echo -e "${GREEN}✅ 示例JMeter测试计划存在${NC}"
else
    echo -e "${YELLOW}⚠️  示例JMeter测试计划不存在${NC}"
fi

echo -e "\n${YELLOW}11. 检查脚本文件${NC}"
scripts=("start.sh" "test-api.sh" "check-config.sh")
for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo -e "${GREEN}✅ $script 存在且可执行${NC}"
        else
            echo -e "${YELLOW}⚠️  $script 存在但不可执行${NC}"
            echo -e "${BLUE}💡 运行: chmod +x $script${NC}"
        fi
    else
        echo -e "${RED}❌ $script 不存在${NC}"
    fi
done

echo -e "\n${YELLOW}12. 检查Docker环境${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker 已安装${NC}"
    docker_version=$(docker --version)
    echo -e "${BLUE}📋 Docker版本: $docker_version${NC}"
else
    echo -e "${RED}❌ Docker 未安装${NC}"
fi

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose 已安装${NC}"
    compose_version=$(docker-compose --version)
    echo -e "${BLUE}📋 Docker Compose版本: $compose_version${NC}"
else
    echo -e "${RED}❌ Docker Compose 未安装${NC}"
fi

echo -e "\n=== 配置检查完成 ==="

# 提供建议
echo -e "\n${BLUE}💡 建议操作:${NC}"
echo "1. 如果.env文件不存在，请运行: cp .env.example .env"
echo "2. 编辑.env文件，设置正确的HOST_DATA_DIR路径"
echo "3. 确保Docker和Docker Compose已正确安装"
echo "4. 运行 ./start.sh 启动系统"
echo "5. 运行 ./test-api.sh 测试API功能"

echo -e "\n${GREEN}✅ 配置检查脚本执行完成${NC}"
