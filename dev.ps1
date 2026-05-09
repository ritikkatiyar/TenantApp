param(
    [int]$FrontendPort = 3000,
    [int]$BackendPort = 8080,
    [switch]$SkipDocker
)

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "TenantAppFE"
$LogDir = Join-Path $RootDir "logs\dev"
$BackendLog = Join-Path $LogDir "backend.log"
$BackendErrLog = Join-Path $LogDir "backend.err.log"
$FrontendLog = Join-Path $LogDir "frontend.log"
$FrontendErrLog = Join-Path $LogDir "frontend.err.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Step {
    param([string]$Message)
    Write-Host "[dev] $Message" -ForegroundColor Cyan
}

function Test-CommandExists {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Wait-ForMysql {
    param([int]$TimeoutSeconds = 120)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $status = docker inspect --format "{{.State.Health.Status}}" tenant-living-mysql 2>$null
        if ($status -eq "healthy") {
            return
        }

        Write-Step "Waiting for MySQL health check... current status: $status"
        Start-Sleep -Seconds 3
    } while ((Get-Date) -lt $deadline)

    throw "MySQL did not become healthy within $TimeoutSeconds seconds."
}

function Get-MysqlHostPort {
    $portLine = docker port tenant-living-mysql 3306/tcp | Select-Object -First 1
    if (-not $portLine) {
        return 3307
    }

    return [int]($portLine -replace ".*:", "")
}

function Stop-ChildProcess {
    param($Process, [string]$Name)

    if ($Process -and -not $Process.HasExited) {
        Write-Step "Stopping $Name..."
        Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
    }
}

if (-not (Test-CommandExists "mvn")) {
    throw "Maven was not found on PATH."
}

if (-not (Test-CommandExists "npm")) {
    throw "npm was not found on PATH."
}

if (-not $SkipDocker) {
    if (-not (Test-CommandExists "docker")) {
        throw "Docker was not found on PATH. Start MySQL yourself and rerun with -SkipDocker."
    }

    Write-Step "Starting MySQL with Docker Compose..."
    Push-Location $RootDir
    try {
        docker compose up -d mysql
        Wait-ForMysql
    } finally {
        Pop-Location
    }
}

$mysqlPort = if ($SkipDocker) { 3307 } else { Get-MysqlHostPort }
$dbUrl = "jdbc:mysql://localhost:$mysqlPort/tenant_living?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"

Write-Step "Using DB_URL=$dbUrl"
Write-Step "Starting backend on http://localhost:$BackendPort"

$backendCommand = @"
`$env:DB_URL='$dbUrl'
`$env:DB_USERNAME='tenant_living'
`$env:DB_PASSWORD='tenant_living'
`$env:SERVER_PORT='$BackendPort'
mvn spring-boot:run
"@

$backendProcess = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList "-NoProfile", "-Command", $backendCommand `
    -WorkingDirectory $BackendDir `
    -RedirectStandardOutput $BackendLog `
    -RedirectStandardError $BackendErrLog `
    -PassThru

Write-Step "Starting frontend on http://localhost:$FrontendPort"

$frontendProcess = Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run web -- --port $FrontendPort" `
    -WorkingDirectory $FrontendDir `
    -RedirectStandardOutput $FrontendLog `
    -RedirectStandardError $FrontendErrLog `
    -PassThru

Write-Step "Backend log: $BackendLog"
Write-Step "Frontend log: $FrontendLog"
Write-Step "Press Ctrl+C to stop backend and frontend."

try {
    Get-Content $BackendLog, $BackendErrLog, $FrontendLog, $FrontendErrLog -Wait -Tail 0
} finally {
    Stop-ChildProcess $backendProcess "backend"
    Stop-ChildProcess $frontendProcess "frontend"
}
