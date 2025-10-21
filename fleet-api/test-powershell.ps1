# Test Payment Tracking System with PowerShell

Write-Host "🧪 Testing Payment Tracking System..." -ForegroundColor Green

# Test 1: Record a payment
Write-Host "Test 1: Recording a payment..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:5000/api/twilio-whatsapp/webhook" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "From=whatsapp:+1234567890&Body=/payments CONTRACT001 5000 Monthly service payment"

Write-Host "`n"

# Test 2: View monthly payments
Write-Host "Test 2: Viewing monthly payments..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:5000/api/twilio-whatsapp/webhook" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "From=whatsapp:+1234567890&Body=/payments"

Write-Host "`n"

# Test 3: Record a receivable
Write-Host "Test 3: Recording a receivable..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:5000/api/twilio-whatsapp/webhook" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "From=whatsapp:+1234567890&Body=/receivable CONTRACT002 3000 Outstanding invoice"

Write-Host "`n"

# Test 4: View monthly receivables
Write-Host "Test 4: Viewing monthly receivables..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:5000/api/twilio-whatsapp/webhook" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "From=whatsapp:+1234567890&Body=/receivable"

Write-Host "`n"

# Test 5: Record received payment
Write-Host "Test 5: Recording received payment..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:5000/api/twilio-whatsapp/webhook" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "From=whatsapp:+1234567890&Body=/received CONTRACT003 1500 Partial payment"

Write-Host "`n"

# Test 6: View monthly received payments
Write-Host "Test 6: Viewing monthly received payments..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:5000/api/twilio-whatsapp/webhook" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "From=whatsapp:+1234567890&Body=/received"

Write-Host "`n"

# Test 7: Help command
Write-Host "Test 7: Help command..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:5000/api/twilio-whatsapp/webhook" -Method POST -ContentType "application/x-www-form-urlencoded" -Body "From=whatsapp:+1234567890&Body=/help"

Write-Host "`n"

Write-Host "✅ All tests completed!" -ForegroundColor Green
