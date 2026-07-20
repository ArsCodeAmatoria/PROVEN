# BCCSA COR official audit workbook

- **File:** `official-workbook.xlsm`
- **Source:** `BCCSACOROHSAuditV2-01Jan2026R13_2026Jan01.xlsm`
- **Version:** V2 R13 (2026-01-01)
- **Macros:** Yes (`xl/vbaProject.bin`) — exports preserve VBA via zip merge

Proven fills company header + technique Y/N/N/A + narrative comments from
`CorAuditSession` responses, using the cell map in
`src/lib/cor/bccsa-excel-map.json`. Question bank:
`src/lib/cor/bccsa-question-bank.json`.

Re-extract after replacing the workbook:

```bash
npx tsx scripts/extract-bccsa-cor-bank.ts
```
