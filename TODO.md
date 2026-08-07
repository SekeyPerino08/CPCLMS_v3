# TODO: Student/Faculty Dashboard Update + Books Page Fix + Reject Modal

## Student/Faculty Dashboard
- [x] 1. Analyze dashboard files and confirm backend data source
- [x] 2. Create plan and get user approval
- [x] 3. Remove Quick Links section (card + array + unused imports)
- [x] 4. Adjust stats grid to 3 evenly-spaced full-width cards in a single row
- [x] 5. Make Recent Transactions expand to full width (remove lg:col-span-2 and grid wrapper)

## Browse Books Page Overlap Fix
- [x] 6. Add conditional bottom padding (pb-44) to content container when cart bar is visible so book cards are never covered
- [x] 7. Verify with lint/build

## Requests Page — Replace window.prompt() with Custom Reject Modal
- [x] 8. Add reject modal state (rejectTarget, rejectReason, rejectLoading, rejectError)
- [x] 9. Add openRejectModal() and rewrite handleReject() to use modal state (no window.prompt)
- [x] 10. Wire Reject button to openRejectModal()
- [x] 11. Add "Reject Borrow Request" modal JSX with textarea, Cancel, and Confirm Reject buttons (dark modern style)
- [x] 12. Verify with tsc --noEmit (no errors in requests/page)

