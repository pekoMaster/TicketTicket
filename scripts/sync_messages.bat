@echo off
chcp 65001 >nul
echo Syncing message files...
copy /Y "H:\OneDrive\RB\TRPG\TicketTicket\messages\zh-TW.json" "H:\OneDrive\RB\TRPG\TicketTicket\messages\zh-TW-DESKTOP-MO1D91E.json"
copy /Y "H:\OneDrive\RB\TRPG\TicketTicket\messages\ja.json" "H:\OneDrive\RB\TRPG\TicketTicket\messages\ja-DESKTOP-MO1D91E.json"
copy /Y "H:\OneDrive\RB\TRPG\TicketTicket\messages\en.json" "H:\OneDrive\RB\TRPG\TicketTicket\messages\en-DESKTOP-MO1D91E.json"
copy /Y "H:\OneDrive\RB\TRPG\TicketTicket\messages\zh-CN.json" "H:\OneDrive\RB\TRPG\TicketTicket\messages\zh-CN-DESKTOP-MO1D91E.json"
echo Done!
