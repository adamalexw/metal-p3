<#
.SYNOPSIS
    Removes cover image files whose names contain special/diacritic characters
    (e.g. "Ćover.jpg") from every album folder under the given base path.

.PARAMETER BasePath
    Root folder containing album sub-folders. Defaults to M:\Mp3

.PARAMETER WhatIf
    Dry-run: print what would be deleted without actually deleting anything.

.EXAMPLE
    .\Remove-SpecialCoverFiles.ps1 -WhatIf
    .\Remove-SpecialCoverFiles.ps1 -BasePath "M:\Mp3"
#>
param(
    [string]$BasePath = 'M:\Mp3',
    [switch]$WhatIf
)

$coverPattern = [regex]'^cover\.jpe?g$'

if (-not (Test-Path $BasePath)) {
    Write-Error "Base path does not exist: $BasePath"
    exit 1
}

$removed = 0

Get-ChildItem -LiteralPath $BasePath -Directory | ForEach-Object {
    $folder = $_.FullName

    Get-ChildItem -LiteralPath $folder -File | Where-Object {
        $name = $_.Name

        # Skip exact ASCII cover files — these are what we want to keep
        if ($coverPattern.IsMatch($name)) {
            return $false
        }

        # Match any .jpg/.jpeg whose name contains non-ASCII characters.
        # This catches lookalike characters from other scripts (e.g. Cyrillic С U+0421
        # instead of Latin C U+0043) which NFKD normalization cannot strip.
        $hasNonAscii = ($name.ToCharArray() | Where-Object { [int]$_ -gt 127 }).Count -gt 0
        $isJpeg = $_.Extension -match '(?i)\.jpe?g$'

        return $hasNonAscii -and $isJpeg
    } | ForEach-Object {
        if ($WhatIf) {
            Write-Host "[WhatIf] Would delete: $($_.FullName)"
        } else {
            Write-Host "Deleting: $($_.FullName)"
            Remove-Item -LiteralPath $_.FullName -Force
        }
        $removed++
    }
}

if ($WhatIf) {
    Write-Host "`nDry run complete. $removed file(s) would be deleted."
} else {
    Write-Host "`nDone. $removed file(s) deleted."
}
