# abrir-mongosh.ps1 — Ejecutar desde la carpeta Practicas: .\abrir-mongosh.ps1
$mongoshPath = "C:\Users\Usuario\Desktop\MICROSERVICIOSIV\Practicas\Practica1\mongosh-2.9.2-win32-x64\mongosh-2.9.2-win32-x64\bin"
$toolsPath   = "C:\Users\Usuario\Desktop\MICROSERVICIOSIV\Practicas\Practica1\mongodb-database-tools-windows-x86_64-100.18.0\mongodb-database-tools-windows-x86_64-100.18.0\bin"
$env:PATH = "$mongoshPath;$toolsPath;$env:PATH"
Write-Host "OK mongosh y mongoimport disponibles." -ForegroundColor Green
Write-Host "Directorio: $(Get-Location)" -ForegroundColor Cyan
& "$mongoshPath\mongosh.exe"
