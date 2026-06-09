$host.UI.RawUI.ForegroundColor = 'White'
Write-Host ''
Write-Host 'Normal:' -ForegroundColor Gray
Write-Host '  Pitstop PRO' -ForegroundColor White
Write-Host ''
Write-Host 'Negrita (ESC E 1):' -ForegroundColor Gray
Write-Host '  Pitstop PRO' -ForegroundColor White
Write-Host ''
Write-Host 'Doble ancho (GS ! 0x10) + negrita:' -ForegroundColor Gray
$dw = 'PPiittssttoopp  PPRROO'
Write-Host "  $dw" -ForegroundColor White
Write-Host ''
Write-Host 'Doble alto + doble ancho (GS ! 0x11):' -ForegroundColor Gray
Write-Host "  $dw" -ForegroundColor White
Write-Host "  $dw" -ForegroundColor White
Write-Host ''
Read-Host 'Presiona Enter para salir'
