<#
.SYNOPSIS
    Kills any process listening on a specific port.
.DESCRIPTION
    Reads PORT from the parent directory's .env file (PORT=XXXX), or uses
    the provided argument, or defaults to 4000. Uses netstat to find the
    process and taskkill to terminate it.
.PARAMETER Port
    The port number to kill. Overrides any value in .env.
.EXAMPLE
    .\kill-port.ps1
    .\kill-port.ps1 3000
#>

param(
    [Parameter(Position = 0)]
    [string]$Port = ""
)

# --- Resolve the .env path (scripts dir is backend/scripts/) ---------------
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile = Join-Path -Path (Join-Path -Path $ScriptDir -ChildPath "..") -ChildPath ".env"

# --- Determine port ---------------------------------------------------------
if (-not $Port) {
    if (Test-Path $EnvFile) {
        $Match = Select-String -Path $EnvFile -Pattern '^PORT=(\d+)'
        if ($Match) {
            $Port = $Match.Matches.Groups[1].Value
            Write-Host "[INFO] Read PORT=$Port from $EnvFile"
        }
    }
}

if (-not $Port) {
    $Port = "4000"
    Write-Host "[INFO] No PORT found, defaulting to $Port"
}

Write-Host "------------------------------------------------------------"
Write-Host "  Looking for process listening on port $Port ..."
Write-Host "------------------------------------------------------------"

# --- Find PID --------------------------------------------------------------
$Pattern = ":$Port "
$FoundPids = @()

$NetstatOutput = netstat -ano | Select-String $Pattern | Where-Object { $_ -match "LISTENING" }

foreach ($Line in $NetstatOutput) {
    # netstat -ano output ends with PID
    $Tokens = $Line -split '\s+'
    $ProcessId = $Tokens[-1]
    if ($ProcessId -match '^\d+$') {
        $FoundPids += $ProcessId
    }
}

if ($FoundPids.Count -eq 0) {
    Write-Host "[OK] No process found listening on port $Port - nothing to do."
    exit 0
}

# Remove duplicates
$FoundPids = $FoundPids | Select-Object -Unique

# --- Kill ------------------------------------------------------------------
foreach ($ProcessId in $FoundPids) {
    Write-Host "[KILL] Killing PID $ProcessId ..."
    try {
        taskkill /PID $ProcessId /F 2>&1 | Out-Null
        Write-Host "[DONE] PID $ProcessId on port $Port has been terminated."
    }
    catch {
        Write-Host "[WARN] Could not kill PID $ProcessId (permission or already dead): $_"
    }
}

