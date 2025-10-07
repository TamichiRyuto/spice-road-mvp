#!/bin/bash

echo "🍛 Spice Curry Application - Full Integration Test"
echo "=================================================="

# Function to test endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $description... "
    
    response=$(curl -s -w "%{http_code}" "$url" -o /tmp/response_body)
    status_code="${response: -3}"
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo "✅ OK ($status_code)"
        if [ -s /tmp/response_body ]; then
            echo "   Response: $(head -c 100 /tmp/response_body)..."
        fi
    else
        echo "❌ FAILED ($status_code)"
        if [ -s /tmp/response_body ]; then
            echo "   Error: $(cat /tmp/response_body)"
        fi
    fi
    echo ""
}

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

echo "🧪 Testing C++26 API Server (Port 8080)"
echo "----------------------------------------"
test_endpoint "http://localhost:8080/health" "Health Check"
test_endpoint "http://localhost:8080/metrics" "Performance Metrics"
test_endpoint "http://localhost:8080/api/shops" "Shop Data API"

echo "🧪 Testing Node.js API Server (Port 8000)"
echo "------------------------------------------"
test_endpoint "http://localhost:8000/health" "Health Check"
test_endpoint "http://localhost:8000/api/shops" "Shop Data API"

echo "🧪 Testing Frontend React App (Port 3000)"
echo "-------------------------------------------"
test_endpoint "http://localhost:3000" "React Frontend"

echo "🧪 Testing Database Server (Port 9000)"
echo "---------------------------------------"
test_endpoint "http://localhost:9000/shops.json" "JSON Database"

echo "🧪 Testing Nginx Reverse Proxy (Port 80)"
echo "-----------------------------------------"
test_endpoint "http://localhost/health" "Load Balanced Health Check"
test_endpoint "http://localhost/cpp-health" "C++26 Direct Health"
test_endpoint "http://localhost/nodejs-health" "Node.js Direct Health"
test_endpoint "http://localhost/api/shops" "Load Balanced API"

echo "🧪 Testing Redis Cache (Port 6379)"
echo "----------------------------------"
if command -v redis-cli &> /dev/null; then
    echo -n "Testing Redis connection... "
    if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
        echo "✅ OK (PONG)"
    else
        echo "❌ FAILED (No response)"
    fi
else
    echo "⚠️ redis-cli not available, skipping Redis test"
fi

echo ""
echo "🎉 Full Integration Test Completed!"
echo "===================================="

# Clean up temp file
rm -f /tmp/response_body