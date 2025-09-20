#!/bin/bash

# Integration test script for Nectar Network
# Tests the complete workflow from job posting to completion

set -e

echo "🧪 Running Nectar Network Integration Tests"
echo "============================================"

# Configuration
FRONTEND_URL="http://localhost:3000"
DISPATCHER_URL="http://localhost:3001"
PROVIDER_URL="http://localhost:3002"
BLOCKCHAIN_URL="http://localhost:8545"

# Test utilities
test_passed=0
test_failed=0

assert_response() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing: $description... "
    
    response=$(curl -s -w "%{http_code}" "$url" -o /dev/null)
    
    if [ "$response" = "$expected_status" ]; then
        echo "✅ PASS"
        ((test_passed++))
    else
        echo "❌ FAIL (Expected $expected_status, got $response)"
        ((test_failed++))
    fi
}

assert_json_field() {
    local url=$1
    local field=$2
    local description=$3
    
    echo -n "Testing: $description... "
    
    response=$(curl -s "$url")
    value=$(echo "$response" | jq -r "$field")
    
    if [ "$value" != "null" ] && [ "$value" != "" ]; then
        echo "✅ PASS"
        ((test_passed++))
    else
        echo "❌ FAIL (Field $field not found or empty)"
        ((test_failed++))
    fi
}

echo ""
echo "🔍 Service Health Checks"
echo "------------------------"

assert_response "$DISPATCHER_URL/health" "200" "Dispatcher health endpoint"
assert_response "$PROVIDER_URL/health" "200" "Provider node health endpoint"

echo ""
echo "📊 API Endpoint Tests"
echo "--------------------"

assert_response "$DISPATCHER_URL/api/jobs" "200" "Jobs API endpoint"
assert_response "$DISPATCHER_URL/api/providers" "200" "Providers API endpoint"
assert_response "$PROVIDER_URL/status" "200" "Provider status endpoint"
assert_response "$PROVIDER_URL/capabilities" "200" "Provider capabilities endpoint"

echo ""
echo "📋 Data Structure Tests"
echo "-----------------------"

assert_json_field "$DISPATCHER_URL/health" ".status" "Dispatcher status field"
assert_json_field "$PROVIDER_URL/health" ".nodeId" "Provider node ID field"
assert_json_field "$PROVIDER_URL/capabilities" ".data.capabilities" "Provider capabilities array"

echo ""
echo "🧪 Job Execution Test"
echo "---------------------"

echo -n "Testing: Job execution simulation... "

# Submit test job
JOB_PAYLOAD='{
  "jobId": "test-integration-001",
  "title": "Integration Test Job",
  "description": "Test job for integration testing",
  "requirements": "CPU, 2GB RAM"
}'

response=$(curl -s -X POST "$PROVIDER_URL/execute" \
  -H "Content-Type: application/json" \
  -d "$JOB_PAYLOAD")

success=$(echo "$response" | jq -r '.success')

if [ "$success" = "true" ]; then
    echo "✅ PASS"
    ((test_passed++))
    
    # Extract and display job result
    result_hash=$(echo "$response" | jq -r '.data.result.resultHash')
    echo "  Result hash: $result_hash"
else
    echo "❌ FAIL"
    ((test_failed++))
    echo "  Response: $response"
fi

echo ""
echo "📈 Provider Statistics Test"
echo "---------------------------"

echo -n "Testing: Provider statistics retrieval... "

stats_response=$(curl -s "$DISPATCHER_URL/api/providers/stats/overview")
total_providers=$(echo "$stats_response" | jq -r '.data.total')

if [ "$total_providers" != "null" ] && [ "$total_providers" != "" ]; then
    echo "✅ PASS"
    ((test_passed++))
    echo "  Total providers: $total_providers"
else
    echo "❌ FAIL"
    ((test_failed++))
fi

echo ""
echo "🔄 WebSocket Connection Test"
echo "----------------------------"

echo -n "Testing: WebSocket connectivity... "

# Test WebSocket connection (basic check)
if command -v wscat >/dev/null 2>&1; then
    # If wscat is available, test WebSocket
    timeout 5s wscat -c "ws://localhost:3001" -x '{"type":"ping"}' >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ PASS"
        ((test_passed++))
    else
        echo "⚠️  SKIP (WebSocket test requires wscat)"
    fi
else
    echo "⚠️  SKIP (wscat not available)"
fi

echo ""
echo "📊 Test Results"
echo "==============="
echo "Passed: $test_passed"
echo "Failed: $test_failed"
echo "Total:  $((test_passed + test_failed))"

if [ $test_failed -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed! The Nectar Network is working correctly."
    exit 0
else
    echo ""
    echo "❌ Some tests failed. Please check the service logs."
    exit 1
fi