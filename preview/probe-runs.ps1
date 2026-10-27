Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile('D:\web\drift-portfolio\preview\services-real.png')
"size: $($bmp.Width)x$($bmp.Height)"
foreach ($y in 160, 168, 170, 180, 200, 220, 240, 260, 280, 380, 470, 500, 560) {
  $counts = @()
  $start = -1
  for ($x = 0; $x -lt 1440; $x += 2) {
    $p = $bmp.GetPixel($x, $y)
    if ((($p.R + $p.G + $p.B) / 3.0) -gt 130) {
      if ($start -lt 0) { $start = $x }
    } else {
      if ($start -ge 0) { $counts += "$start-$($x - 2)"; $start = -1 }
    }
  }
  if ($start -ge 0) { $counts += "$start-1438" }
  "y=$y runs: " + ($counts -join ' ')
}
$bmp.Dispose()
