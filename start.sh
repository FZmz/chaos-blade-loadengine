#!/bin/bash

# 负载测试系统启动脚本

set -e

echo "=== 负载测试系统启动脚本 ==="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查.env文件是否存在
if [ ! -f .env ]; then
    echo "警告: .env文件不存在，正在从模板创建..."
    cp .env.example .env
    echo "请编辑 .env 文件，设置正确的 HOST_DATA_DIR 路径"
    echo "当前工作目录: $(pwd)"
    echo "建议设置 HOST_DATA_DIR=$(pwd)/data"
    
    # 自动设置HOST_DATA_DIR为当前目录下的data目录
    sed -i "s|HOST_DATA_DIR=.*|HOST_DATA_DIR=$(pwd)/data|" .env
    echo "已自动设置 HOST_DATA_DIR=$(pwd)/data"
fi

# 创建必要的目录
echo "创建数据目录..."
mkdir -p data/uploads/testplans
mkdir -p data/uploads/data
mkdir -p data/uploads/misc
mkdir -p data/results
mkdir -p data/reports

# 设置目录权限
chmod -R 755 data/

echo "数据目录创建完成"

# 拉取JMeter镜像
echo "拉取JMeter Docker镜像..."
docker pull justb4/jmeter:latest

# 构建并启动服务
echo "构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

# 健康检查
echo "执行健康检查..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://1.94.151.57/api/loadtest/health > /dev/null 2>&1; then
        echo "✅ 服务启动成功！"
        break
    else
        echo "⏳ 等待服务启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ 服务启动超时，请检查日志"
    echo "查看日志命令: docker-compose logs"
    exit 1
fi

echo ""
echo "=== 服务启动完成 ==="
echo "访问地址:"
echo "  - 健康检查: http://1.94.151.57/api/loadtest/health"
echo "  - 文件列表: http://1.94.151.57/api/files/list"
echo "  - 上传文件: http://1.94.151.57/uploads/"
echo "  - 测试报告: http://1.94.151.57/reports/"
echo ""
echo "常用命令:"
echo "  - 查看日志: docker-compose logs -f"
echo "  - 停止服务: docker-compose down"
echo "  - 重启服务: docker-compose restart"
echo ""
echo "示例测试计划文件位于: examples/sample-test-plan.jmx"
echo ""
echo "API文档请参考 README.md 文件"
