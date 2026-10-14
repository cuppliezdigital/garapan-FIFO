@echo off
title Monitoring FIFO - Server ^& Cloudflare Tunnel
color 0A
cls
echo ==============================================================
echo        MONITORING FIFO (J^&T CARGO) - CLOUDFLARE RUNNER
echo ==============================================================
echo.
echo [*] Memeriksa koneksi database lokal...
echo [*] Memulai Backend Server di background (Port 3000)...

taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

start "FIFO Backend" /min node backend/server.js
timeout /t 3 /nobreak >nul

echo [*] Backend aktif!
echo [*] Menghubungkan Cloudflare Tunnel kecepatan tinggi...
echo.
echo ==============================================================
echo   JANGAN TUTUP JENDELA INI AGAR APLIKASI DI HP TETAP ONLINE!
echo   (Jika ingin menutup, tekan Ctrl+C atau silang jendela)
echo ==============================================================
echo.

.\cloudflared.exe tunnel --url http://localhost:3000

pause

