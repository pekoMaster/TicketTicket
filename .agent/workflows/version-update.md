---
description: How to update the TicketTicket version number
---
# Version Update Workflow

When updating the TicketTicket version, you must update these 3 files:

## Files to Update
// turbo-all

1. **package.json** (line 3)
   ```json
   "version": "X.XX",
   ```

2. **src/components/layout/SideNav.tsx** (line ~105)
   ```tsx
   TicketTicket vX.XX
   ```

3. **src/app/profile/page.tsx** (line ~772)
   ```tsx
   TicketTicket vX.XX ({t('version')})
   ```

## Quick Command to Find All Version Locations
```powershell
Select-String -Path "package.json","src\components\layout\SideNav.tsx","src\app\profile\page.tsx" -Pattern "TicketTicket v|`"version`":"
```

## After Updating
```powershell
git add -A
git commit -m "vX.XX - [description]"
git push origin main
```
