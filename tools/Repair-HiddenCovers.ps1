<#
.SYNOPSIS
    Finds Cover.jpg files that are hidden, extracts the embedded image from the
    first .mp3 in the same folder, resizes it to 500x500, and saves it as a
    visible Cover.jpg.

.DESCRIPTION
    Walks every folder under BasePath recursively. For each folder that contains
    a hidden Cover.jpg:
      1. Finds the first .mp3 file in the folder.
      2. Extracts the APIC (attached picture) frame from the ID3v2 tag.
      3. Resizes the image to 500x500 using high-quality bicubic interpolation.
      4. Writes the result as Cover.jpg with no Hidden attribute.
    Falls back to unhiding and resizing the existing hidden Cover.jpg when no
    ID3 cover image is found in the .mp3.

.PARAMETER BasePath
    Root folder to search. Defaults to M:\Mp3

.PARAMETER Size
    Output image dimension (square). Defaults to 500.

.PARAMETER WhatIf
    Dry-run: report what would be done without writing any files.

.EXAMPLE
    .\Repair-HiddenCovers.ps1 -WhatIf
    .\Repair-HiddenCovers.ps1 -BasePath "M:\Mp3" -Size 500
#>
param(
    [string]$BasePath = 'M:\Mp3',
    [int]$Size = 500,
    [switch]$WhatIf
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $BasePath)) {
    Write-Error "Base path does not exist: $BasePath"
    exit 1
}

# ---------------------------------------------------------------------------
# ID3v2 cover extraction
# Supports ID3v2.2 (PIC), ID3v2.3 (APIC) and ID3v2.4 (APIC syncsafe sizes).
# ---------------------------------------------------------------------------
function Get-Id3CoverBytes {
    param([string]$Mp3Path)

    try {
        $bytes = [System.IO.File]::ReadAllBytes($Mp3Path)
        $len   = $bytes.Length

        if ($len -lt 10) { return $null }
        if ($bytes[0] -ne 0x49 -or $bytes[1] -ne 0x44 -or $bytes[2] -ne 0x33) { return $null }

        $ver    = $bytes[3]   # major version: 2, 3 or 4
        $flags  = $bytes[5]

        # Tag size is a 4-byte syncsafe integer
        $tagSize = (($bytes[6] -band 0x7F) -shl 21) -bor `
                   (($bytes[7] -band 0x7F) -shl 14) -bor `
                   (($bytes[8] -band 0x7F) -shl  7) -bor `
                    ($bytes[9] -band 0x7F)
        $tagEnd  = [Math]::Min(10 + $tagSize, $len)
        $pos     = 10

        # Skip extended header if present
        if (($flags -band 0x40) -and $ver -ge 3) {
            if ($ver -eq 4) {
                $extLen = (($bytes[$pos]   -band 0x7F) -shl 21) -bor `
                          (($bytes[$pos+1] -band 0x7F) -shl 14) -bor `
                          (($bytes[$pos+2] -band 0x7F) -shl  7) -bor `
                           ($bytes[$pos+3] -band 0x7F)
            } else {
                $extLen = ($bytes[$pos]   -shl 24) -bor ($bytes[$pos+1] -shl 16) -bor `
                          ($bytes[$pos+2] -shl  8) -bor  $bytes[$pos+3]
                $extLen += 4  # include the size field itself for v2.3
            }
            $pos += $extLen
        }

        while ($pos -lt $tagEnd - 6) {
            if ($ver -eq 2) {
                # ID3v2.2: 3-char ID, 3-byte big-endian size, no flags
                $fid = [System.Text.Encoding]::ASCII.GetString($bytes, $pos, 3)
                $fsz = ($bytes[$pos+3] -shl 16) -bor ($bytes[$pos+4] -shl 8) -bor $bytes[$pos+5]
                $pos += 6
                $targetId = 'PIC'
            } else {
                if ($pos + 10 -gt $tagEnd) { break }
                $fid = [System.Text.Encoding]::ASCII.GetString($bytes, $pos, 4)
                if ($ver -eq 4) {
                    # ID3v2.4 uses syncsafe frame sizes
                    $fsz = (($bytes[$pos+4] -band 0x7F) -shl 21) -bor `
                           (($bytes[$pos+5] -band 0x7F) -shl 14) -bor `
                           (($bytes[$pos+6] -band 0x7F) -shl  7) -bor `
                            ($bytes[$pos+7] -band 0x7F)
                } else {
                    # ID3v2.3 uses normal big-endian frame sizes
                    $fsz = ($bytes[$pos+4] -shl 24) -bor ($bytes[$pos+5] -shl 16) -bor `
                           ($bytes[$pos+6] -shl  8) -bor  $bytes[$pos+7]
                }
                $pos += 10
                $targetId = 'APIC'
            }

            if ($fsz -le 0 -or $pos + $fsz -gt $tagEnd) { break }
            $frameEnd = $pos + $fsz

            if ($fid -eq $targetId) {
                $p   = $pos
                $enc = $bytes[$p++]   # text encoding

                if ($ver -eq 2) {
                    # PIC: 3-char format string ("JPG", "PNG", etc.)
                    $p += 3
                    $p++  # picture type byte
                } else {
                    # APIC: null-terminated MIME type
                    while ($p -lt $frameEnd -and $bytes[$p] -ne 0) { $p++ }
                    $p++  # skip null terminator
                    $p++  # picture type byte
                }

                # Skip description — may be double-null (UTF-16) or single-null (Latin1/UTF-8)
                if ($enc -eq 1 -or $enc -eq 2) {
                    while ($p + 1 -lt $frameEnd -and -not ($bytes[$p] -eq 0 -and $bytes[$p+1] -eq 0)) { $p += 2 }
                    $p += 2
                } else {
                    while ($p -lt $frameEnd -and $bytes[$p] -ne 0) { $p++ }
                    $p++
                }

                $imgLen = $frameEnd - $p
                if ($imgLen -gt 0) {
                    return $bytes[$p..($frameEnd - 1)]
                }
            }

            $pos = $frameEnd
        }
    } catch {
        Write-Warning "ID3 parse error in '$Mp3Path': $_"
    }

    return $null
}

# ---------------------------------------------------------------------------
# Resize image bytes to $Size x $Size, returns JPEG bytes
# ---------------------------------------------------------------------------
function Resize-ImageBytes {
    param([byte[]]$ImageBytes, [int]$TargetSize)

    $inStream  = New-Object System.IO.MemoryStream(,$ImageBytes)
    $src       = [System.Drawing.Image]::FromStream($inStream)
    $bmp       = New-Object System.Drawing.Bitmap($TargetSize, $TargetSize)
    $g         = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $TargetSize, $TargetSize)
    $g.Dispose()
    $src.Dispose()
    $inStream.Dispose()

    $outStream = New-Object System.IO.MemoryStream
    $bmp.Save($outStream, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $bmp.Dispose()
    $result = $outStream.ToArray()
    $outStream.Dispose()

    return $result
}

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
$fixed   = 0
$skipped = 0
$errors  = 0

Get-ChildItem -LiteralPath $BasePath -Directory -Recurse | ForEach-Object {
    $folder    = $_.FullName
    $coverPath = Join-Path $folder 'Cover.jpg'

    if (-not (Test-Path -LiteralPath $coverPath)) { return }

    $coverFile = Get-Item -LiteralPath $coverPath -Force
    if (-not ($coverFile.Attributes -band [System.IO.FileAttributes]::Hidden)) { return }

    Write-Host "Found hidden Cover.jpg in: $folder"

    # Find the first .mp3 in this folder
    $mp3 = Get-ChildItem -LiteralPath $folder -Filter '*.mp3' -File | Select-Object -First 1

    $sourceBytes = $null

    if ($mp3) {
        $sourceBytes = Get-Id3CoverBytes -Mp3Path $mp3.FullName
        if ($sourceBytes) {
            Write-Host "  -> Extracted cover from: $($mp3.Name)"
        } else {
            Write-Warning "  -> No ID3 cover found in '$($mp3.Name)', falling back to existing hidden file"
        }
    } else {
        Write-Warning "  -> No .mp3 found in folder, falling back to existing hidden file"
    }

    # Fall back to the hidden Cover.jpg itself
    if (-not $sourceBytes) {
        try {
            $sourceBytes = [System.IO.File]::ReadAllBytes($coverPath)
        } catch {
            Write-Warning "  -> Could not read existing Cover.jpg: $_"
            $errors++
            return
        }
    }

    if ($WhatIf) {
        Write-Host "  [WhatIf] Would write resized ${Size}x${Size} Cover.jpg (visible)"
        $fixed++
        return
    }

    try {
        $resized = Resize-ImageBytes -ImageBytes $sourceBytes -TargetSize $Size

        # Write to a temp file then move to avoid partial writes
        $temp = $coverPath + '.tmp'
        [System.IO.File]::WriteAllBytes($temp, $resized)

        # Replace the hidden Cover.jpg with the temp file (no hidden attribute)
        if (Test-Path -LiteralPath $coverPath) {
            Remove-Item -LiteralPath $coverPath -Force
        }
        Rename-Item -LiteralPath $temp -NewName 'Cover.jpg'

        # Ensure Hidden is not set
        $newFile = Get-Item -LiteralPath $coverPath -Force
        $newFile.Attributes = $newFile.Attributes -band (-bnot [System.IO.FileAttributes]::Hidden)

        Write-Host "  -> Saved ${Size}x${Size} visible Cover.jpg"
        $fixed++
    } catch {
        Write-Error "  -> Failed to write Cover.jpg in '$folder': $_"
        $errors++
    }
}

if ($WhatIf) {
    Write-Host "`nDry run complete. $fixed folder(s) would be fixed."
} else {
    Write-Host "`nDone. $fixed fixed, $skipped skipped, $errors errors."
}
