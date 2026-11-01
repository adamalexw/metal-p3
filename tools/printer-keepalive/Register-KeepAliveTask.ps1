<#
.SYNOPSIS
    Registers a Windows Scheduled Task that runs Print-KeepAlivePage.ps1.

.EXAMPLE
    .\Register-KeepAliveTask.ps1                       # every 4 days at 10:00
    .\Register-KeepAliveTask.ps1 -EveryNDays 3 -At 18:30

    # Remove later with:
    Unregister-ScheduledTask -TaskName 'Epson Ink Keep-Alive' -Confirm:$false
#>
param(
    [int]$EveryNDays = 4,
    [string]$At = '10:00',
    [string]$PrinterName = '*WF-2860*',
    [string]$TaskName = 'Epson Ink Keep-Alive'
)

$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'Print-KeepAlivePage.ps1'

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`" -PrinterName `"$PrinterName`""

$trigger = New-ScheduledTaskTrigger -Daily -DaysInterval $EveryNDays -At $At

# StartWhenAvailable: if the PC was off/asleep at the scheduled time, run as soon as possible afterwards
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
    -Description 'Prints a small CMYK page so the inkjet nozzles do not dry out.' -Force | Out-Null

Write-Host "Registered '$TaskName': every $EveryNDays day(s) at $At -> $script"
Write-Host "Test it now with:  Start-ScheduledTask -TaskName '$TaskName'"
