param(
    [Parameter(Position=0)]
    [string]$Command = "start",
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

function Write-Step {
    param([string]$Message)
    Write-Host "[dev] $Message" -ForegroundColor Cyan
}

function Remove-DockerContainerIfExists {
    param([string]$Name)

        # Use docker inspect – swallow errors if container does not exist
    try {
        $inspectOutput = docker inspect $Name 2>$null
    } catch {
        return
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Removing stale Docker container $Name..."
        docker rm -f $Name | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to remove stale Docker container $Name."
        }
    }
    docker inspect $Name 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Removing stale Docker container $Name..."
        docker rm -f $Name | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to remove stale Docker container $Name."
        }
    }
}

function Remove-StaleDockerContainerIfExists {
    param([string]$Name)

    # Use docker inspect instead of the unreliable name=^/$Name$ filter on Windows
    try {
        $inspectOutput = docker inspect $Name 2>$null
    } catch {
        $inspectOutput = $null
    }
    if ($LASTEXITCODE -ne 0 -or -not $inspectOutput) {
        return
    }

    # Skip removal if container was created by Docker Compose (has compose service label)
    try {
        $info = ($inspectOutput | ConvertFrom-Json)[0]
        if ($info.Config.Labels.'com.docker.compose.service') {
            return
        }
    } catch {}

    Remove-DockerContainerIfExists $Name
}

if ($Command -ieq "stop") {
    Write-Step "Stopping all infrastructure..."
    Push-Location $RootDir
    try {
        docker compose down

    } finally {
        Pop-Location
    }
    Stop-Process -Name "java", "node" -Force -ErrorAction SilentlyContinue
    Write-Step "All services stopped successfully."
    exit 0
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null



function Test-CommandExists {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Import-DotEnv {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return
    }

    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }

        $key, $value = $line.Split("=", 2)
        $key = $key.Trim()
        $value = $value.Trim().Trim('"').Trim("'")

        if ($key) {
            Set-Item -Path "Env:$key" -Value $value
        }
    }
}

function Wait-ForMysql {
    param([int]$TimeoutSeconds = 120)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $status = Get-DockerHealthOrStatus "tenant-living-mysql"
        if ($status -eq "healthy") {
            return
        }

        Write-Step "Waiting for MySQL health check... current status: $status"
        Start-Sleep -Seconds 3
    } while ((Get-Date) -lt $deadline)

    throw "MySQL did not become healthy within $TimeoutSeconds seconds."
}

function Get-DockerHealthOrStatus {
    param([string]$Name)

    # Use plain 'docker inspect' — Go-template --format is unreliable in Windows PowerShell
    $inspectOutput = docker inspect $Name 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $inspectOutput) {
        return "not created"
    }

    try {
        $info = ($inspectOutput | ConvertFrom-Json)[0]
        if ($info.State.Health -and $info.State.Health.Status) {
            return $info.State.Health.Status
        }
        if ($info.State.Status) {
            return $info.State.Status
        }
    } catch {
        return "unknown"
    }

    return "unknown"
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

Import-DotEnv (Join-Path $RootDir ".env")

if (-not $SkipDocker) {
    if (-not (Test-CommandExists "docker")) {
        throw "Docker was not found on PATH. Start MySQL and Redis yourself and rerun with -SkipDocker."
    }

    Write-Step "Starting MySQL with Docker Compose..."
    Push-Location $RootDir
    try {
        Remove-StaleDockerContainerIfExists "tenant-living-mysql"
        docker compose up -d mysql
        if ($LASTEXITCODE -ne 0) {
            throw "Docker Compose failed to start MySQL."
        }
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
`$env:APP_AI_ENABLED='$env:APP_AI_ENABLED'
`$env:SPRING_AI_MODEL_CHAT='$env:SPRING_AI_MODEL_CHAT'
`$env:GEMINI_API_KEY='$env:GEMINI_API_KEY'
`$env:GEMINI_MODEL='$env:GEMINI_MODEL'
`$env:GEMINI_TEMPERATURE='$env:GEMINI_TEMPERATURE'
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
