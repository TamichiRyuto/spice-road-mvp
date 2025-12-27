#!/bin/bash

# Terraform Validation Test Script (TDD)
# This test ensures that Terraform configuration is valid

set -e

echo "🧪 Running Terraform Validation Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name=$1
    local test_command=$2

    echo -n "  Testing: $test_name... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Change to terraform directory
cd "$(dirname "$0")/.."

# Load .env file if it exists (for GCP authentication)
if [ -f .env ]; then
    echo ""
    echo -e "${YELLOW}ℹ️  Loading environment variables from .env${NC}"
    set -a
    source <(grep -v '^#' .env | grep -v '^$' | sed 's/\r$//')
    set +a

    if [ -n "$GOOGLE_PROJECT" ]; then
        echo -e "${GREEN}✓ Using GCP Project: $GOOGLE_PROJECT${NC}"
    fi
fi

echo ""
echo "📋 Test Suite: Terraform Configuration"
echo "======================================="

# Test 1: Check if main.tf exists
run_test "main.tf exists" "test -f main.tf"

# Test 2: Check if variables.tf exists
run_test "variables.tf exists" "test -f variables.tf"

# Test 3: Check if outputs.tf exists
run_test "outputs.tf exists" "test -f outputs.tf"

# Test 4: Check if versions.tf exists
run_test "versions.tf exists" "test -f versions.tf"

# Test 5: Check if .env.example exists
run_test ".env.example exists" "test -f .env.example"

# Test 6: Terraform format check
run_test "Terraform format is valid" "terraform fmt -check -recursive"

# Test 7: Terraform init
echo -n "  Testing: Terraform initialization... "
if terraform init -backend=false > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 8: Terraform validate
run_test "Terraform configuration is valid" "terraform validate"

# Test 9: Check required variables are defined
echo -n "  Testing: Required variables are defined... "
if terraform validate 2>&1 | grep -q "variable.*is required" ; then
    echo -e "${RED}✗ FAIL${NC}"
    echo "    Missing required variables"
    ((TESTS_FAILED++))
else
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
fi

# Test 10: Check module structure
run_test "Artifact Registry module exists" "test -d modules/artifact-registry"
run_test "Cloud Run module exists" "test -d modules/cloud-run"
run_test "IAM module exists" "test -d modules/iam"
run_test "Storage module exists" "test -d modules/storage"

# Test 14: Verify simplified 2-service architecture (no nginx)
echo -n "  Testing: Architecture has 2 Cloud Run services... "
CLOUDRUN_COUNT=$(grep -c "module \"cloud_run_" main.tf || echo 0)
if [ "$CLOUDRUN_COUNT" -eq 2 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "    ℹ️  Frontend + C++ API only (nginx removed for cost optimization)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "    Expected 2 Cloud Run services, found $CLOUDRUN_COUNT"
    ((TESTS_FAILED++))
fi

# Test 15: Verify no nginx references in main.tf
echo -n "  Testing: No nginx references in main.tf... "
if grep -i "nginx" main.tf > /dev/null 2>&1; then
    echo -e "${RED}✗ FAIL${NC}"
    echo "    Found nginx references (should be removed per ARCHITECTURE.md)"
    ((TESTS_FAILED++))
else
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
fi

# Test 16: Check for common security issues
echo -n "  Testing: No hardcoded credentials... "
if grep -r -E "(password|secret|key)\s*=\s*\"" --include="*.tf" . | grep -v "secret_id\|secret_name\|key_name" > /dev/null 2>&1; then
    echo -e "${RED}✗ FAIL${NC}"
    echo "    Found potential hardcoded credentials"
    ((TESTS_FAILED++))
else
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
fi

echo ""
echo "======================================="
echo "📊 Test Results:"
echo "   Passed: ${TESTS_PASSED}"
echo "   Failed: ${TESTS_FAILED}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
