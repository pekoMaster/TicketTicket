@echo off
chcp 65001 >nul
cd /d "H:\OneDrive\RB\TRPG\TicketTicket"
npx tsc --noEmit 2>&1
echo EXIT_CODE=%ERRORLEVEL%
