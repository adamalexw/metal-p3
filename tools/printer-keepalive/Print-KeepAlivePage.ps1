<#
.SYNOPSIS
    Prints a small CMYK test page to keep inkjet nozzles from drying out.

.DESCRIPTION
    Draws thin bars and fine lines in Cyan, Magenta, Yellow and Black so every
    print-head channel fires, while using as little ink as possible.
    Uses only built-in .NET (System.Drawing), so it needs no extra software.

.EXAMPLE
    .\Print-KeepAlivePage.ps1
    .\Print-KeepAlivePage.ps1 -PrinterName "EPSON WF-2860 Series"
#>
param(
    # Wildcard pattern matched against installed printer names
    [string]$PrinterName = '*WF-2860*'
)

$ErrorActionPreference = 'Stop'
$logFile = Join-Path $PSScriptRoot 'keepalive.log'

function Write-Log([string]$Message) {
    $line = "{0:yyyy-MM-dd HH:mm:ss}  {1}" -f (Get-Date), $Message
    Add-Content -Path $logFile -Value $line
    Write-Host $line
}

try {
    Add-Type -AssemblyName System.Drawing

    $printer = Get-Printer | Where-Object Name -like $PrinterName | Select-Object -First 1
    if (-not $printer) {
        $available = (Get-Printer).Name -join ', '
        throw "No printer matching '$PrinterName'. Available: $available"
    }

    $doc = New-Object System.Drawing.Printing.PrintDocument
    $doc.PrinterSettings.PrinterName = $printer.Name
    $doc.DocumentName = 'Ink keep-alive page'
    $doc.DefaultPageSettings.Color = $true

    $doc.add_PrintPage({
        param($sender, $e)
        $g = $e.Graphics
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
        $m = $e.MarginBounds      # units: 1/100 inch

        $titleFont = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold)
        $smallFont = New-Object System.Drawing.Font('Segoe UI', 9)
        $g.DrawString('Ink keep-alive page', $titleFont, [System.Drawing.Brushes]::Black, $m.Left, $m.Top)
        $g.DrawString(("Printed {0:dddd d MMM yyyy HH:mm}" -f (Get-Date)), $smallFont, [System.Drawing.Brushes]::Black, $m.Left, $m.Top + 30)

        $colors = [ordered]@{
            Cyan    = [System.Drawing.Color]::FromArgb(0, 255, 255)
            Magenta = [System.Drawing.Color]::FromArgb(255, 0, 255)
            Yellow  = [System.Drawing.Color]::FromArgb(255, 255, 0)
            Black   = [System.Drawing.Color]::Black
        }

        $y = $m.Top + 70
        $barHeight = 25   # 0.25 inch solid bar - fires every nozzle
        $labelWidth = 80

        foreach ($name in $colors.Keys) {
            $c = $colors[$name]
            $brush = New-Object System.Drawing.SolidBrush $c
            $pen = New-Object System.Drawing.Pen $c, 1

            $g.DrawString($name, $smallFont, [System.Drawing.Brushes]::Black, $m.Left, $y + 5)

            # Solid bar
            $g.FillRectangle($brush, $m.Left + $labelWidth, $y, $m.Width - $labelWidth, $barHeight)

            # Fine diagonal lines below - similar to a nozzle check pattern
            $lineTop = $y + $barHeight + 5
            for ($x = $m.Left + $labelWidth; $x -lt $m.Right - 20; $x += 8) {
                $g.DrawLine($pen, $x, $lineTop, $x + 15, $lineTop + 20)
            }

            $brush.Dispose(); $pen.Dispose()
            $y += $barHeight + 45
        }

        $titleFont.Dispose(); $smallFont.Dispose()
        $e.HasMorePages = $false
    })

    $doc.Print()
    $doc.Dispose()
    Write-Log "Sent keep-alive page to '$($printer.Name)'"
}
catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    exit 1
}
