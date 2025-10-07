#!/bin/bash

echo "🍛 Spice Curry Application - C++26 Only Integration Test"
echo "========================================================"

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
echo "⏳ Waiting for C++26 API server to start..."
sleep 15

echo "🧪 Testing C++26 API Server (Port 8080) - Primary Backend"
echo "---------------------------------------------------------"
test_endpoint "http://localhost:8080/health" "C++26 Health Check"
test_endpoint "http://localhost:8080/metrics" "C++26 Performance Metrics"
test_endpoint "http://localhost:8080/api/shops" "C++26 Shop Data API"
test_endpoint "http://localhost:8080/" "C++26 Default Response"

echo "🧪 Testing Frontend React App (Port 3000)"
echo "-------------------------------------------"
test_endpoint "http://localhost:3000" "React Frontend (using C++26 API)"

echo "🧪 Testing Database Server (Port 9000)"
echo "---------------------------------------"
test_endpoint "http://localhost:9000/shops.json" "JSON Database"

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
echo "🎉 C++26 Only Integration Test Completed!"
echo "=========================================="
echo "Backend: Modern C++26 + stdexec (No Node.js)"
echo "Features: std::print, std::format, std::ranges, std::expected, stdexec"
echo "Compiler: GCC 15.2.0"

# Clean up temp file
rm -f /tmp/response_body