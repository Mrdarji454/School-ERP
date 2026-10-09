$ErrorActionPreference = 'Stop'
$configPath = 'C:\Program Files\MongoDB\Server\8.3\bin\mongod.cfg'
$dataPath = 'C:\Program Files\MongoDB\Server\8.3\data'
$workspace = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$statusPath = Join-Path $workspace '.verification\mongodb-conversion-status.json'
$backupRoot = 'C:\Users\Darji Mukesh\AppData\Local\SchoolERP\Backups'
$backupPath = Join-Path $backupRoot ('mongodb-' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss'))
$stopped = $false
$changed = $false
function Write-Status($stage, $message) {
    @{ stage = $stage; message = $message; backupPath = $backupPath; time = [DateTime]::UtcNow.ToString('o') } |
        ConvertTo-Json | Set-Content -LiteralPath $statusPath -Encoding UTF8
}
try {
    if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'Run this script with Windows Administrator privileges.'
    }
    $config = [IO.File]::ReadAllText($configPath)
    if ($config -match '(?m)^replication\s*:') { throw 'Replication is already configured; inspect before rerunning.' }
    if ($config -notmatch '(?m)^#replication\s*:' -or $config -notmatch 'bindIp: 127\.0\.0\.1') { throw 'Unexpected MongoDB configuration; no changes made.' }
    New-Item -ItemType Directory -Path $backupPath -ErrorAction Stop | Out-Null
    Copy-Item -LiteralPath $configPath -Destination (Join-Path $backupPath 'mongod.cfg')
    Write-Status 'stopping' 'Stopping MongoDB for a consistent cold backup.'
    Stop-Service -Name MongoDB -ErrorAction Stop
    (Get-Service MongoDB).WaitForStatus('Stopped', [TimeSpan]::FromSeconds(45))
    $stopped = $true
    Write-Status 'backup' 'Copying and hashing the stopped database.'
    $backupData = Join-Path $backupPath 'data'
    Copy-Item -LiteralPath $dataPath -Destination $backupData -Recurse -ErrorAction Stop
    foreach ($file in Get-ChildItem -LiteralPath $dataPath -File -Recurse) {
        $relative = $file.FullName.Substring($dataPath.Length).TrimStart('\')
        $copy = Join-Path $backupData $relative
        if ((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $copy -Algorithm SHA256).Hash) {
            throw "Backup verification failed for $relative"
        }
    }
    $updated = $config -replace '(?m)^#replication\s*:', "replication:`r`n  replSetName: rs0"
    [IO.File]::WriteAllText($configPath, $updated, (New-Object Text.UTF8Encoding($false)))
    $changed = $true
    Start-Service -Name MongoDB -ErrorAction Stop
    (Get-Service MongoDB).WaitForStatus('Running', [TimeSpan]::FromSeconds(45))
    $stopped = $false
    Write-Status 'ready-to-initialize' 'Backup verified; MongoDB restarted with replSetName rs0 and loopback binding unchanged.'
} catch {
    $failure = $_.Exception.Message
    if ($changed) {
        Stop-Service -Name MongoDB -ErrorAction SilentlyContinue
        Copy-Item -LiteralPath (Join-Path $backupPath 'mongod.cfg') -Destination $configPath -Force
    }
    if ($stopped -or $changed) { Start-Service -Name MongoDB -ErrorAction SilentlyContinue }
    Write-Status 'failed' $failure
    exit 1
}
