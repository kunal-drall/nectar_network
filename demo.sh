#!/bin/bash

# Nectar Network Demo Script
# This script demonstrates the full workflow of the platform

echo "🌟 Welcome to Nectar Network Demo"
echo "================================="
echo ""

# Check if services are running
check_service() {
    local url=$1
    local name=$2
    
    if curl -s "$url" > /dev/null; then
        echo "✅ $name is running"
        return 0
    else
        echo "❌ $name is not responding"
        return 1
    fi
}

echo "🔍 Checking services..."
check_service "http://localhost:8545" "Hardhat Blockchain"
check_service "http://localhost:3000" "Frontend"
check_service "http://localhost:3001/health" "Dispatcher"
check_service "http://localhost:3002/health" "Provider Node"
echo ""

# Display service URLs
echo "🔗 Service URLs:"
echo "  Frontend:        http://localhost:3000"
echo "  Dispatcher API:  http://localhost:3001"
echo "  Provider Node:   http://localhost:3002"
echo "  Blockchain RPC:  http://localhost:8545"
echo ""

# Demo API calls
echo "📡 Demo API Calls:"
echo ""

echo "1. 📊 Dispatcher Status:"
curl -s http://localhost:3001/health | jq '.'
echo ""

echo "2. 🖥️  Provider Node Status:"
curl -s http://localhost:3002/status | jq '.'
echo ""

echo "3. ⚙️  Provider Capabilities:"
curl -s http://localhost:3002/capabilities | jq '.data.capabilities'
echo ""

echo "4. 📋 Current Jobs:"
curl -s http://localhost:3001/api/jobs | jq '.total'
echo ""

echo "5. 👥 Provider Statistics:"
curl -s http://localhost:3001/api/providers/stats/overview | jq '.'
echo ""

# Simulate job execution
echo "🧪 Simulating Job Execution:"
echo ""

JOB_ID="demo-$(date +%s)"
echo "Creating demo job with ID: $JOB_ID"

RESULT=$(curl -s -X POST http://localhost:3002/execute \
  -H "Content-Type: application/json" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"title\": \"Demo ML Training Job\",
    \"description\": \"Train a neural network for image classification\",
    \"requirements\": \"GPU, 8GB RAM, TensorFlow\"
  }")

echo "Job execution result:"
echo "$RESULT" | jq '.'
echo ""

# Instructions for manual testing
echo "🎯 Manual Testing Instructions:"
echo ""
echo "1. Open browser to http://localhost:3000"
echo "2. Connect your MetaMask wallet to localhost:8545"
echo "3. Import a test account with funds from Hardhat"
echo "4. Post a new job through the frontend"
echo "5. Check the provider dashboard for available jobs"
echo "6. Monitor real-time updates via WebSocket"
echo ""

echo "🔐 Test Account (from Hardhat):"
echo "Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""

echo "📚 Additional Resources:"
echo "  - API Documentation: See README.md"
echo "  - Smart Contract ABIs: contracts/artifacts/"
echo "  - Frontend Components: frontend/src/components/"
echo "  - WebSocket Events: Connect to ws://localhost:3001"
echo ""

echo "✨ Demo completed! Happy testing!"
echo "================================="