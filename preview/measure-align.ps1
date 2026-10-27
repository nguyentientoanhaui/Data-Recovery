# Reports, per text band, the leftmost x of bright pixels — to spot misalignment.
param([string]$Shot, [int]$Width = 1440, [int]$Height = 900, [int]$X0 = 0, [int]$X1 = 1440)
Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Shot).Path)
$bands = @()
$inBand = $false
$start = 0
for ($y = 0; $y -lt $Height; $y += 2) {
  $minX = -1
  $maxX = -1
  for ($x = $X0; $x -lt $X1; $x += 2) {
    $p = $bmp.GetPixel($x, $y)
    if ((($p.R + $p.G + $p.B) / 3.0) -gt 160) {
      if ($minX -lt 0) { $minX = $x }
      $maxX = $x
    }
  }
  if ($minX -ge 0) {
    if (-not $inBand) { $inBand = $true; $start = $y }
    $bands += [pscustomobject]@{ Y = $y; MinX = $minX; MaxX = $maxX }
  } else {
    $inBand = $false
  }
}
$bmp.Dispose()
# group consecutive rows into bands
$grouped = @()
$g = @()
$prev = -100
foreach ($b in $bands) {
  if ($b.Y - $prev -gt 6 -and $g.Count -gt 0) { $grouped += ,@($g); $g = @() }
  $g += $b
  $prev = $b.Y
}
if ($g.Count -gt 0) { $grouped += ,@($g) }
$i = 0
foreach ($band in $grouped) {
  $i++
  $y0 = $band[0].Y
  $y1 = $band[$band.Count - 1].Y
  $minX = ($band | ForEach-Object { $_.MinX } | Measure-Object -Minimum).Minimum
  $maxX = ($band | ForEach-Object { $_.MaxX } | Measure-Object -Maximum).Maximum
  "band $i : y=$y0..$y1  leftX=$minX  rightX=$maxX"
}
