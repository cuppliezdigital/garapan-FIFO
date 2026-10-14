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
echo [*] Mengaktifkan Link Permanen Tailscale Funnel...
"C:\Program Files\Tailscale\tailscale.exe" funnel --bg 3000 >nul 2>&1

echo.
echo ==============================================================
echo   LINK PERMANEN RESMI (TETAP SELAMANYA):
echo   👉 https://chedu2.tailad5890.ts.net
echo ==============================================================
echo.
echo [*] Menjalankan Cloudflare Tunnel cadangan...
echo.

.\cloudflared.exe tunnel --url http://localhost:3000

pause

