#!/bin/bash

# E2E Tests for Spice Road Application
# Tests the full stack: cpp-api (PostgreSQL) + frontend

set -e

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

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

echo "======================================"
echo "Spice Road E2E Test Suite"
echo "======================================"
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker-compose &> /dev/null; then
    echo "docker-compose not found"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "curl not found"
    exit 1
fi

# Test 1: PostgreSQL Database Connection
log_test "PostgreSQL Database Connection"
result=$(docker-compose exec -T postgres psql -U spice_user -d spice_road -c "SELECT COUNT(*) FROM shops;" 2>&1 | grep -E "^\s*[0-9]+" || echo "FAIL")
if [[ "$result" != "FAIL" ]]; then
    count=$(echo "$result" | tr -d ' ')
    log_pass "Database contains $count shops"
else
    log_fail "Cannot connect to database"
fi

# Test 2: cpp-api Health Check
log_test "cpp-api Health Check"
response=$(docker-compose exec -T cpp-api curl -s http://localhost:8080/health 2>/dev/null || echo "FAIL")
if echo "$response" | grep -q "OK"; then
    log_pass "cpp-api is healthy"
else
    log_fail "cpp-api health check failed"
fi

# Test 3: cpp-api PostgreSQL Integration
log_test "cpp-api PostgreSQL Integration (Get All Shops)"
response=$(docker-compose exec -T cpp-api curl -s http://localhost:8080/api/shops 2>/dev/null || echo "FAIL")
if [[ "$response" != "FAIL" ]] && [[ -n "$response" ]] && echo "$response" | grep -q "name"; then
    shop_count=$(echo "$response" | grep -o '"name"' | wc -l)
    log_pass "cpp-api returned $shop_count shops from PostgreSQL"
else
    log_fail "cpp-api failed to fetch shops from PostgreSQL"
fi

# Test 4: Get Shop by ID
log_test "cpp-api Get Shop by ID (id=1)"
response=$(docker-compose exec -T cpp-api curl -s http://localhost:8080/api/shops/1 2>/dev/null || echo "FAIL")
if [[ "$response" != "FAIL" ]] && echo "$response" | grep -q "name"; then
    shop_name=$(echo "$response" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_pass "Got shop: $shop_name"
else
    log_fail "Failed to get shop by ID"
fi

# Test 5: Shop Data Validation
log_test "Shop Data Validation (Required Fields)"
response=$(docker-compose exec -T cpp-api curl -s http://localhost:8080/api/shops/1 2>/dev/null || echo "FAIL")
if [[ "$response" != "FAIL" ]]; then
    has_name=$(echo "$response" | grep -c '"name"' || echo 0)
    has_latitude=$(echo "$response" | grep -c '"latitude"' || echo 0)
    has_longitude=$(echo "$response" | grep -c '"longitude"' || echo 0)
    has_region=$(echo "$response" | grep -c '"region"' || echo 0)
    has_spiciness=$(echo "$response" | grep -c '"spiciness"' || echo 0)

    if [[ $has_name -gt 0 ]] && [[ $has_latitude -gt 0 ]] && [[ $has_longitude -gt 0 ]] && [[ $has_region -gt 0 ]] && [[ $has_spiciness -gt 0 ]]; then
        log_pass "Shop data contains all required fields"
    else
        log_fail "Shop data missing required fields (name:$has_name, lat:$has_latitude, lon:$has_longitude, region:$has_region, spice:$has_spiciness)"
    fi
else
    log_fail "Failed to fetch shop data for validation"
fi

# Test 6: Non-existent Shop
log_test "Non-existent Shop (404 Expected)"
http_code=$(docker-compose exec -T cpp-api curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/shops/999999 2>/dev/null || echo "FAIL")
if [[ "$http_code" == "404" ]]; then
    log_pass "Non-existent shop returned 404"
else
    log_fail "Non-existent shop returned $http_code instead of 404"
fi

# Test 7: Metrics Endpoint
log_test "cpp-api Metrics Endpoint"
response=$(docker-compose exec -T cpp-api curl -s http://localhost:8080/metrics 2>/dev/null || echo "FAIL")
if echo "$response" | grep -q "api"; then
    log_pass "Metrics endpoint is working"
else
    log_fail "Metrics endpoint failed"
fi

# Test 8: Database Query Performance
log_test "Database Query Performance"
start_time=$(date +%s%N)
response=$(docker-compose exec -T cpp-api curl -s http://localhost:8080/api/shops 2>/dev/null || echo "FAIL")
end_time=$(date +%s%N)
if [[ "$response" != "FAIL" ]]; then
    elapsed_ms=$(( (end_time - start_time) / 1000000 ))
    if [[ $elapsed_ms -lt 1000 ]]; then
        log_pass "Query completed in ${elapsed_ms}ms (< 1000ms)"
    else
        log_fail "Query took ${elapsed_ms}ms (>= 1000ms)"
    fi
else
    log_fail "Query failed"
fi

# Test 9: CORS Headers
log_test "CORS Headers Present"
headers=$(docker-compose exec -T cpp-api curl -s -I http://localhost:8080/api/shops 2>/dev/null || echo "FAIL")
if echo "$headers" | grep -qi "Access-Control-Allow-Origin"; then
    log_pass "CORS headers are present"
else
    log_fail "CORS headers are missing"
fi

# Test 10: Data Integrity (Shop Count Matches)
log_test "Data Integrity Check"
db_count=$(docker-compose exec -T postgres psql -U spice_user -d spice_road -t -c "SELECT COUNT(*) FROM shops;" 2>/dev/null | tr -d ' ' || echo "0")
api_count=$(docker-compose exec -T cpp-api curl -s http://localhost:8080/api/shops 2>/dev/null | grep -o '"name"' | wc -l || echo "0")
if [[ "$db_count" == "$api_count" ]]; then
    log_pass "Shop count matches (DB: $db_count, API: $api_count)"
else
    log_fail "Shop count mismatch (DB: $db_count, API: $api_count)"
fi

# Summary
echo ""
echo "======================================"
echo "E2E Test Summary"
echo "======================================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo "======================================"

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "${GREEN}✓ All E2E tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some E2E tests failed!${NC}"
    exit 1
fi
