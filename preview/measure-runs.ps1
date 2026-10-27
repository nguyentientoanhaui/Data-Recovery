# Prints bright-pixel runs (x ranges) for specific rows — element edge detection.
param([string]$Shot, [int[]]$Rows, [int]$X0 = 0, [int]$X1 = 1440)
Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Shot).Path)
foreach ($y in $Rows) {
  $runs = @()
  $start = -1
  for ($x = $X0; $x -lt $X1; $x += 2) {
    $p = $bmp.GetPixel($x, $y)
    $bright = ((($p.R + $p.G + $p.B) / 3.0) -gt 130)
    if ($bright -and $start -lt 0) { $start = $x }
    if (-not $bright -and $start -ge 0) {
      if ($x - $start -ge 4) { $runs += "$start..$($x - 2)" }
      $start = -1
    }
  }
  if ($start -ge 0 -and ($X1 - 1 - $start) -ge 4) { $runs += "$start..$($X1 - 2)" }
  "y=$y : " + (($runs | ForEach-Object { $_ }) -join '  |  ')
}
$bmp.Dispose()
