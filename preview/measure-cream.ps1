# Verifies the hero: cream caption band below, video above, text inside the band.
param([string]$Shot = "preview\layout-cream.png", [int]$Width = 1440, [int]$Height = 900)
Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Shot).Path)
$cream = 0
$firstCream = -1
$lastCream = -1
for ($y = 0; $y -lt $Height; $y += 2) {
  $p = $bmp.GetPixel(640, $y)
  if ($p.R -gt 225 -and $p.G -gt 205 -and $p.B -lt 220) {
    if ($firstCream -lt 0) { $firstCream = $y }
    $lastCream = $y
    $cream++
  }
}
# dark text pixels inside the cream band
$textInBand = 0
for ($y = $firstCream; $y -le $lastCream; $y += 2) {
  for ($x = 40; $x -lt 900; $x += 2) {
    $p = $bmp.GetPixel($x, $y)
    if (($p.R + $p.G + $p.B) / 3.0 -lt 110) { $textInBand++ }
  }
}
"cream band: y=$firstCream..$lastCream ($($lastCream - $firstCream)px tall, $cream sampled rows)"
"video area above band: $firstCream px of $Height ($([Math]::Round(100 * $firstCream / $Height))%)"
"dark text pixels inside cream band: $textInBand"
# no bright white text should sit above the band (over the video)
$whiteAbove = 0
for ($y = 0; $y -lt $firstCream; $y += 2) {
  for ($x = 40; $x -lt 900; $x += 2) {
    $p = $bmp.GetPixel($x, $y)
    if ((($p.R + $p.G + $p.B) / 3.0) -gt 200) { $whiteAbove++ }
  }
}
"bright pixels above band (x<900, should be ~0): $whiteAbove"
$bmp.Dispose()
