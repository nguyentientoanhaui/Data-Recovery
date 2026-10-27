# Measures the vertical footprint of the hero text cluster in a screenshot.
# Usage: node-free; run from the drift-portfolio dir.
param([string]$Shot = "preview\layout-after2.png", [int]$Width = 1440, [int]$Height = 900, [int]$X0 = 40, [int]$X1 = 920)
Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Shot).Path)
$rows = @()
for ($y = 0; $y -lt $Height; $y += 4) {
  $c = 0
  for ($x = $X0; $x -lt $X1; $x += 2) {
    $p = $bmp.GetPixel($x, $y)
    if ((($p.R + $p.G + $p.B) / 3.0) -gt 180) { $c++ }
  }
  if ($c -gt 4) { $rows += $y }
}
$bmp.Dispose()
if ($rows.Count -eq 0) { "NO TEXT ROWS FOUND"; exit 1 }
$first = ($rows | Measure-Object -Minimum).Minimum
$last = ($rows | Measure-Object -Maximum).Maximum
$band = ($rows | Where-Object { $_ -gt 100 })
$contentFirst = ($band | Measure-Object -Minimum).Minimum
"textTop=$contentFirst textBottom=$last"
"hero text occupies y $contentFirst..$last = $($last - $contentFirst + 4)px tall"
"video clear above text: $contentFirst px of $Height (about $([Math]::Round(100 * $contentFirst / $Height))%)"
