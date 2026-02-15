<#
Adds or updates a hosts file entry on Windows.
Run PowerShell as Administrator.
Usage:
  .\add-hosts-windows.ps1 -Ip 192.168.1.6 -Host myapp.local
#>
param(
    [string]$Ip = "192.168.1.6",
    [string]$Host = "myapp.local"
)

$hostsPath = "$env:windir\System32\drivers\etc\hosts"
$backupPath = "$hostsPath.bak"

try {
    Copy-Item -Path $hostsPath -Destination $backupPath -Force -ErrorAction Stop
} catch {
    Write-Error "Failed to create backup of hosts file: $_"
    exit 1
}

$pattern = "(^|\s)" + [regex]::Escape($Host) + "(\s|$)"
$lines = Get-Content -Path $hostsPath -ErrorAction Stop
$found = $false
$out = @()

foreach ($line in $lines) {
    if ($line -match $pattern -and $line -notmatch '^#') {
        # replace existing line
        $out += "$Ip`t$Host"
        $found = $true
    } else {
        $out += $line
    }
}

if (-not $found) {
    $out += "$Ip`t$Host"
}

try {
    Set-Content -Path $hostsPath -Value $out -Force -ErrorAction Stop
    Write-Host "Updated hosts file: $hostsPath"
    Write-Host "Backup saved to: $backupPath"
    Write-Host "Entry: $Ip $Host"
} catch {
    Write-Error "Failed to update hosts file: $_"
    exit 1
}
