#!/bin/bash

# API测试脚本

set -e

BASE_URL="http://1.94.151.57"
API_URL="$BASE_URL/api"

echo "=== 负载测试系统API测试 ==="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    
    echo -e "\n${YELLOW}测试: $name${NC}"
    echo "请求: $method $url"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ 成功 (HTTP $http_code)${NC}"
        echo "响应: $body" | jq . 2>/dev/null || echo "响应: $body"
    else
        echo -e "${RED}❌ 失败 (HTTP $http_code)${NC}"
        echo "响应: $body"
    fi
}

# 检查服务是否运行
echo "检查服务状态..."
if ! curl -s "$BASE_URL" > /dev/null; then
    echo -e "${RED}错误: 服务未运行，请先执行 ./start.sh${NC}"
    exit 1
fi

# 1. 健康检查
test_api "健康检查" "GET" "$API_URL/loadtest/health"

# 2. 获取文件列表
test_api "获取文件列表" "GET" "$API_URL/files/list"

# 3. 上传示例测试计划文件
if [ -f "examples/sample-test-plan.jmx" ]; then
    echo -e "\n${YELLOW}测试: 上传测试计划文件${NC}"
    echo "请求: POST $API_URL/files/upload/testplan"
    
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -F "file=@examples/sample-test-plan.jmx" \
        "$API_URL/files/upload/testplan")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ 成功 (HTTP $http_code)${NC}"
        echo "响应: $body" | jq . 2>/dev/null || echo "响应: $body"
        
        # 提取上传的文件路径用于后续测试
        uploaded_file=$(echo "$body" | jq -r '.data.uploadPath' 2>/dev/null | sed 's|.*/data/||')
        if [ "$uploaded_file" != "null" ] && [ -n "$uploaded_file" ]; then
            echo "上传的文件路径: $uploaded_file"
            
            # 4. 启动负载测试
            test_data='{
                "testPlanPath": "'$uploaded_file'",
                "testName": "API测试",
                "description": "通过API启动的测试",
                "threads": 2,
                "loops": 5,
                "rampUp": 10,
                "timeout": 300,
                "heapSize": "512m",
                "properties": {
                    "host": "httpbin.org",
                    "port": "443",
                    "protocol": "https"
                }
            }'
            
            echo -e "\n${YELLOW}测试: 启动负载测试${NC}"
            echo "请求: POST $API_URL/loadtest/start"
            echo "数据: $test_data"
            
            response=$(curl -s -w "\n%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -d "$test_data" \
                "$API_URL/loadtest/start")
            
            http_code=$(echo "$response" | tail -n1)
            body=$(echo "$response" | head -n -1)
            
            if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
                echo -e "${GREEN}✅ 成功 (HTTP $http_code)${NC}"
                echo "响应: $body" | jq . 2>/dev/null || echo "响应: $body"
                
                # 提取执行ID
                execution_id=$(echo "$body" | jq -r '.data.executionId' 2>/dev/null)
                if [ "$execution_id" != "null" ] && [ -n "$execution_id" ]; then
                    echo "执行ID: $execution_id"
                    
                    # 5. 查询测试状态
                    sleep 2
                    test_api "查询测试状态" "GET" "$API_URL/loadtest/status/$execution_id"
                    
                    # 6. 获取所有测试列表
                    test_api "获取测试列表" "GET" "$API_URL/loadtest/list"
                    
                    echo -e "\n${YELLOW}注意: 测试正在后台运行，可以通过以下命令查看状态:${NC}"
                    echo "curl $API_URL/loadtest/status/$execution_id"
                    echo -e "\n${YELLOW}测试完成后可以通过以下命令获取结果:${NC}"
                    echo "curl $API_URL/loadtest/results/$execution_id"
                fi
            else
                echo -e "${RED}❌ 失败 (HTTP $http_code)${NC}"
                echo "响应: $body"
            fi
        fi
    else
        echo -e "${RED}❌ 失败 (HTTP $http_code)${NC}"
        echo "响应: $body"
    fi
else
    echo -e "${YELLOW}跳过文件上传测试: examples/sample-test-plan.jmx 不存在${NC}"
fi

echo -e "\n=== API测试完成 ==="
echo -e "\n${YELLOW}可用的访问地址:${NC}"
echo "- 上传文件: $BASE_URL/uploads/"
echo "- 测试报告: $BASE_URL/reports/"
echo "- 测试结果: $BASE_URL/results/"
