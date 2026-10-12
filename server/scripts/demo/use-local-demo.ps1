# Dot-source in a development PowerShell terminal. No files are changed and no URI/password is printed.
if ($env:NODE_ENV -eq 'production') { throw 'Open a development terminal; demo configuration refuses production mode.' }
$demoDatabasePort = if ($env:DEMO_MONGO_PORT) { [int]$env:DEMO_MONGO_PORT } else { 27018 }
if ($demoDatabasePort -lt 1024 -or $demoDatabasePort -gt 65535 -or $demoDatabasePort -eq 27017) { throw 'Use a dedicated demo database port, normally 27018.' }
$env:DEMO_MONGODB_URI = "mongodb://127.0.0.1:$demoDatabasePort/school_erp_demo?replicaSet=demoRs"
$env:SCHOOL_TIMEZONE = 'Asia/Kolkata'
$env:DEMO_CLIENT_ORIGIN = 'http://127.0.0.1:5174'
$env:DEMO_API_PORT = '5001'
$env:RESOURCE_STORAGE_DIR = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../.demo-resource-files'))
$env:VITE_API_URL = 'http://127.0.0.1:5001/api'
Write-Host 'Dedicated local demo configuration selected. Existing .env files and normal MONGO_URI are unchanged.'
