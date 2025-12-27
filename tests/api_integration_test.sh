#!/bin/bash

# API Integration Tests for cpp-api with PostgreSQL
# Tests basic CRUD operations and API endpoints

set -e

API_URL="${API_URL:-http://localhost:8080}"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

# Test 1: Health Check
log_test "Health Check"
response=$(curl -s -w "\n%{http_code}" "$API_URL/health")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [[ "$http_code" == "200" ]] && echo "$body" | grep -q "OK"; then
    log_pass "Health endpoint returned 200 OK"
else
    log_fail "Health endpoint failed (HTTP $http_code)"
fi

# Test 2: Get All Shops
log_test "Get All Shops"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/shops")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [[ "$http_code" == "200" ]]; then
    if [[ -n "$body" ]] && echo "$body" | grep -q "name"; then
        log_pass "Get all shops returned data (HTTP $http_code)"
    else
        log_fail "Get all shops returned empty response (HTTP $http_code)"
    fi
else
    log_fail "Get all shops failed (HTTP $http_code)"
fi

# Test 3: Get Shop by ID
log_test "Get Shop by ID (id=1)"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/shops/1")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [[ "$http_code" == "200" ]]; then
    if echo "$body" | grep -q "name"; then
        log_pass "Get shop by ID returned data (HTTP $http_code)"
    else
        log_fail "Get shop by ID returned empty response (HTTP $http_code)"
    fi
else
    log_fail "Get shop by ID failed (HTTP $http_code)"
fi

# Test 4: Get Non-existent Shop
log_test "Get Non-existent Shop (id=999999)"
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/shops/999999")
http_code=$(echo "$response" | tail -n 1)

if [[ "$http_code" == "404" ]]; then
    log_pass "Non-existent shop returned 404 as expected"
else
    log_fail "Non-existent shop returned unexpected code (HTTP $http_code)"
fi

# Test 5: Metrics Endpoint
log_test "Metrics Endpoint"
response=$(curl -s -w "\n%{http_code}" "$API_URL/metrics")
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [[ "$http_code" == "200" ]]; then
    if echo "$body" | grep -q "uptime"; then
        log_pass "Metrics endpoint returned data (HTTP $http_code)"
    else
        log_fail "Metrics endpoint returned invalid data (HTTP $http_code)"
    fi
else
    log_fail "Metrics endpoint failed (HTTP $http_code)"
fi

# Test 6: CORS Headers
log_test "CORS Headers"
headers=$(curl -s -I "$API_URL/health")
if echo "$headers" | grep -q "Access-Control-Allow-Origin"; then
    log_pass "CORS headers present"
else
    log_fail "CORS headers missing"
fi

# Test 7: Invalid Endpoint
log_test "Invalid Endpoint"
response=$(curl -s -w "\n%{http_code}" "$API_URL/invalid/endpoint")
http_code=$(echo "$response" | tail -n 1)

if [[ "$http_code" == "404" ]]; then
    log_pass "Invalid endpoint returned 404 as expected"
else
    log_fail "Invalid endpoint returned unexpected code (HTTP $http_code)"
fi

# Summary
echo ""
echo "================================"
echo "API Integration Test Summary"
echo "================================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo "================================"

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
