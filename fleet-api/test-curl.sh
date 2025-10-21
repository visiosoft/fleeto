#!/bin/bash

# Test Payment Tracking System with curl commands

echo "🧪 Testing Payment Tracking System..."

# Test 1: Record a payment
echo "Test 1: Recording a payment..."
curl -X POST http://localhost:5000/api/twilio-whatsapp/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&Body=/payments CONTRACT001 5000 Monthly service payment"

echo -e "\n\n"

# Test 2: View monthly payments
echo "Test 2: Viewing monthly payments..."
curl -X POST http://localhost:5000/api/twilio-whatsapp/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&Body=/payments"

echo -e "\n\n"

# Test 3: Record a receivable
echo "Test 3: Recording a receivable..."
curl -X POST http://localhost:5000/api/twilio-whatsapp/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&Body=/receivable CONTRACT002 3000 Outstanding invoice"

echo -e "\n\n"

# Test 4: View monthly receivables
echo "Test 4: Viewing monthly receivables..."
curl -X POST http://localhost:5000/api/twilio-whatsapp/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&Body=/receivable"

echo -e "\n\n"

# Test 5: Record received payment
echo "Test 5: Recording received payment..."
curl -X POST http://localhost:5000/api/twilio-whatsapp/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&Body=/received CONTRACT003 1500 Partial payment"

echo -e "\n\n"

# Test 6: View monthly received payments
echo "Test 6: Viewing monthly received payments..."
curl -X POST http://localhost:5000/api/twilio-whatsapp/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&Body=/received"

echo -e "\n\n"

# Test 7: Help command
echo "Test 7: Help command..."
curl -X POST http://localhost:5000/api/twilio-whatsapp/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&Body=/help"

echo -e "\n\n"

echo "✅ All tests completed!"
