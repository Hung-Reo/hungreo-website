# UAT Testing Guide & Excel Setup

**Created:** November 9, 2025
**For:** hungreo-website P0-P3 Features Testing
**Total Test Cases:** 40+

---

## 📂 Files Overview

| File | Purpose | Who Uses | When |
|------|---------|----------|------|
| **UAT_TEST_CASES.csv** | Detailed test scenarios | Tester | During test execution |
| **UAT_BUG_TRACKER.csv** | Bug logging and tracking | Tester + Developer | When bugs found |
| **UAT_EXECUTION_LOG.csv** | Daily test run records | Tester | After each test session |
| **UAT_TEST_SUMMARY.csv** | High-level progress dashboard | Manager + Team | Daily standup/reports |

---

## 🚀 Quick Start

### Step 1: Import to Excel

1. **Open Excel** → New Workbook
2. **Import each CSV file as a separate sheet:**
   - Go to **Data** → **Get External Data** → **From Text/CSV**
   - Select `UAT_TEST_CASES.csv`
   - Choose **Comma** as delimiter
   - Import to Sheet 1, rename to "Test Cases"
   - Repeat for other CSV files

3. **Sheet Structure:**
   ```
   Sheet 1: Test Cases
   Sheet 2: Bug Tracker
   Sheet 3: Execution Log
   Sheet 4: Summary Dashboard
   ```

### Step 2: Format Excel Sheets

#### For "Test Cases" Sheet:

1. **Freeze first row:** View → Freeze Panes → Freeze Top Row
2. **Apply filters:** Select header row → Data → Filter
3. **Color-code Status column:**
   - Not Tested = Gray
   - In Progress = Yellow
   - Passed = Green
   - Failed = Red
   - Blocked = Orange

4. **Auto-fit columns:** Select all → Home → Format → AutoFit Column Width

5. **Add conditional formatting for Priority:**
   - Select Priority column
   - Home → Conditional Formatting → Highlight Cell Rules
   - P0 = Red, P1 = Orange, P2 = Yellow, P3 = Blue

#### For "Summary Dashboard" Sheet:

1. **Create charts:**
   - Insert → Pie Chart for "Status Distribution"
   - Insert → Bar Chart for "Tests by Feature"
   - Insert → Column Chart for "Bug Severity"

2. **Add formulas:**
   ```excel
   Pass Rate % = (Passed / Total) * 100
   Overall Progress = (Passed + Failed) / Total * 100
   ```

---

## 📋 How to Use: Step-by-Step

### Daily Testing Workflow

#### Morning (Setup)
```
1. Open Excel workbook
2. Go to "Summary Dashboard" sheet
3. Review yesterday's progress
4. Identify tests to run today (filter by "Not Tested")
5. Create daily plan
```

#### During Testing (Execution)
```
For each test case:

1. Go to "Test Cases" sheet
2. Filter by Feature you're testing
3. Read Test ID, Scenario, Steps
4. Execute test step-by-step
5. Record results:

   IF PASS:
   ✅ Status = "Passed"
   ✅ Tested By = Your name
   ✅ Test Date = Today
   ✅ Notes = (any observations)

   IF FAIL:
   ❌ Status = "Failed"
   ❌ Actual Result = What actually happened
   ❌ Create Bug:
      → Go to "Bug Tracker" sheet
      → Fill new row with bug details
      → Get Bug ID (e.g., BUG-001)
      → Return to "Test Cases" sheet
      → Add Bug ID to test case row

   IF BLOCKED:
   ⚠️ Status = "Blocked"
   ⚠️ Notes = Reason (e.g., "Feature not deployed yet")

6. Log execution in "Execution Log" sheet:
   → Date, Test ID, Status, Time spent
```

#### End of Day (Summary)
```
1. Go to "Summary Dashboard" sheet
2. Update totals:
   - Count Passed tests today
   - Count Failed tests today
   - Count Bugs found today
3. Calculate Pass Rate
4. Update Status (Not Started → In Progress → Done)
5. Add comments for tomorrow
```

---

## 🐛 Bug Tracking Process

### When You Find a Bug:

**Step 1: Create Bug Report**
```
1. Go to "Bug Tracker" sheet
2. Add new row with:

   Bug ID: BUG-XXX (sequential number)
   Related Test ID: TC-P0-001 (from test case)
   Feature: Which feature has the bug
   Severity: Critical/High/Medium/Low
   Priority: Urgent/High/Normal/Low
   Status: Open
   Summary: One-line description
   Description: Detailed explanation
   Steps to Reproduce: 1, 2, 3...
   Expected Behavior: What should happen
   Actual Behavior: What actually happened
   Environment: localhost / Vercel production
   Browser: Chrome 119, Safari 17, etc.
   Screenshot/Video: Link or attachment
   Reported By: Your name
   Reported Date: Today
```

**Step 2: Link Bug to Test Case**
```
1. Go back to "Test Cases" sheet
2. Find the failed test case
3. Add Bug ID in "Bug ID" column
```

**Step 3: Notify Developer**
```
Share bug report with developer:
- Export bug row as CSV
- Or share Excel file
- Or copy to GitHub Issue
```

### Bug Severity Guide

| Severity | Definition | Example |
|----------|------------|---------|
| **Critical** | System crash, data loss, security issue | Cannot login, data deleted |
| **High** | Major feature broken, no workaround | Video won't play, upload fails |
| **Medium** | Feature works but with issues, has workaround | Tooltip shows wrong text |
| **Low** | Cosmetic, minor UX issue | Button alignment off by 2px |

---

## 🔄 Retest Process

### After Developer Fixes Bug:

**Step 1: Update Bug Tracker**
```
1. Developer notifies: "BUG-001 fixed in commit abc123"
2. Go to "Bug Tracker" sheet
3. Find BUG-001
4. Update:
   - Status = "Fixed"
   - Assigned To = Developer name
   - Fixed Date = Today
```

**Step 2: Retest**
```
1. Pull latest code (git pull)
2. Go to "Test Cases" sheet
3. Find test case that failed (has BUG-001 in Bug ID column)
4. Change Status to "In Progress"
5. Execute test again
6. Record result:

   IF NOW PASSES:
   ✅ Status = "Passed"
   ✅ Retest Status = "Pass"
   ✅ Retest Date = Today
   ✅ Return to "Bug Tracker" → Set Status = "Verified"

   IF STILL FAILS:
   ❌ Status = "Failed"
   ❌ Retest Status = "Fail"
   ❌ Return to "Bug Tracker" → Set Status = "Reopened"
   ❌ Add comment: What's still wrong
```

---

## 📊 Excel Formulas & Automation

### Useful Formulas for Summary Sheet

**Calculate Pass Rate:**
```excel
=IF(B2>0, ROUND((C2/B2)*100, 1), 0)
// B2 = Total Tests, C2 = Passed Tests
```

**Overall Progress:**
```excel
=SUMIF(TestCases!$G:$G,"Passed",TestCases!$A:$A)/COUNTA(TestCases!$A:$A)*100
// Counts passed tests vs total tests
```

**Count bugs by severity:**
```excel
=COUNTIF(BugTracker!$D:$D,"Critical")
```

**Tests remaining:**
```excel
=COUNTIF(TestCases!$I:$I,"Not Tested")
```

### Conditional Formatting Rules

**For Status Column (Test Cases):**
```
Formula: =$I2="Passed"
Format: Green fill, dark green text

Formula: =$I2="Failed"
Format: Red fill, dark red text

Formula: =$I2="Blocked"
Format: Orange fill, dark orange text
```

**For Pass Rate (Summary):**
```
Formula: =$H2>=90
Format: Green fill (Excellent)

Formula: AND($H2>=70, $H2<90)
Format: Yellow fill (Acceptable)

Formula: $H2<70
Format: Red fill (Poor - needs attention)
```

---

## 📈 Reporting Templates

### Daily Test Report (Email/Slack)

```
📊 UAT Testing Update - [Date]

✅ Tests Executed Today: 12
   ├─ Passed: 10
   ├─ Failed: 2
   └─ Blocked: 0

🐛 Bugs Found Today: 2
   ├─ Critical: 0
   ├─ High: 1
   ├─ Medium: 1
   └─ Low: 0

📈 Overall Progress:
   ├─ Total Test Cases: 40
   ├─ Completed: 25 (62%)
   ├─ Remaining: 15
   └─ Pass Rate: 92%

🎯 Focus Tomorrow:
   - Complete P1 Document Review tests (TC-P1-006 to TC-P1-010)
   - Retest BUG-001, BUG-002

⚠️ Blockers: None
```

### Weekly Summary Report

```
📊 Week [X] UAT Testing Summary

🎯 Features Tested:
   ✅ P0: Public Video Library - 100% (10/10 passed)
   🟡 P1: Document Review - 70% (7/10 passed, 3 failed)
   🟡 P2: UI Enhancements - 50% (3/6 in progress)
   ⏳ P3: Additional Features - 0% (not started)

🐛 Bugs Summary:
   Total Found: 8
   ├─ Fixed & Verified: 5
   ├─ In Progress: 2
   └─ Open: 1

📈 Metrics:
   ├─ Total Test Coverage: 65% (26/40 tests executed)
   ├─ Pass Rate: 88.5%
   ├─ Critical Bugs: 0 ✅
   └─ Average Test Time: 5 mins/test

🎯 Next Week Goals:
   - Complete P1 retesting
   - Start P2 and P3 testing
   - Target 90% coverage by end of week
```

---

## 🎯 Test Execution Tips

### Best Practices

1. **Test in Order:** Follow test IDs (TC-P0-001, TC-P0-002...) to build logical flow

2. **Use Real Data:** Don't test with dummy data - use realistic files/content

3. **Test Cross-Browser:**
   - Chrome (primary)
   - Safari (Mac users)
   - Firefox (alternative)
   - Mobile Safari (iOS)
   - Chrome Mobile (Android)

4. **Document Everything:**
   - Take screenshots of bugs
   - Record video for complex issues
   - Note exact steps that caused failure

5. **Test Edge Cases:**
   - Maximum file size (20MB)
   - Empty inputs
   - Special characters in text
   - Very long titles
   - Network disconnection during upload

6. **Retest After Fixes:**
   - Don't assume fix works
   - Verify related functionality not broken
   - Check fix works in all browsers

---

## 🔧 Customization Guide

### Add Your Own Test Cases

**Step 1:** Open "Test Cases" sheet

**Step 2:** Add new row with:
```
Test ID: TC-[Priority]-[Number]
Example: TC-P1-011 (P1 feature, test #11)
```

**Step 3:** Fill all columns:
- Feature: Which feature (match existing names)
- Priority: P0/P1/P2/P3
- Test Scenario: What you're testing
- Preconditions: Setup needed
- Test Steps: 1, 2, 3...
- Expected Result: What should happen
- Test Data: Any special data needed

**Step 4:** Update Summary sheet total count

### Add New Feature Module

If you add a new feature (e.g., P4):

1. **Test Cases sheet:** Add rows with TC-P4-XXX
2. **Summary sheet:** Add new row for feature
3. Update formulas to include new range

---

## 📞 Getting Help

### If You're Stuck:

**Technical Issues:**
- Check IMPLEMENTATION_STATUS.md for feature details
- Review PHASE2_EXTENDED_DESIGN.md for expected behavior
- Ask developer for clarification

**Excel Issues:**
- Google: "Excel how to [your question]"
- Use Excel built-in Help (F1)

**Testing Questions:**
- What should I test? → Follow test scenarios in order
- How detailed should my notes be? → More detail = better
- How long should each test take? → Average 3-5 minutes

---

## 🎓 Example: Complete Test Execution

Let's walk through testing TC-P0-001:

**BEFORE TEST:**
```
1. Open Excel → "Test Cases" sheet
2. Filter: Feature = "Public Video Library"
3. Find: TC-P0-001
4. Read scenario: "Verify category grid page loads correctly"
5. Read preconditions: "User is on homepage"
6. Read expected results (4 points)
```

**DURING TEST:**
```
1. Open browser (Chrome)
2. Go to: http://localhost:3000
3. Click "AI Tools" in navigation
4. Observe page load

   [Check #1] Page loads within 2 seconds?
   → Yes ✅ (1.2 seconds)

   [Check #2] All 5 categories visible?
   → Yes ✅ (Leadership, AI Works, Health, Entertaining, Human Philosophy)

   [Check #3] Video counts appear?
   → Yes ✅ (Leadership: 5, AI Works: 3, etc.)

   [Check #4] Icons render properly?
   → Yes ✅ (All lucide-react icons showing)

   [Check #5] Cards clickable?
   → Yes ✅ (Hover shows pointer cursor)
```

**AFTER TEST:**
```
Excel updates:

Status: "Passed"
Actual Result: "All checks passed. Page loads in 1.2s, all 5 categories visible with correct counts."
Tested By: "Hung"
Test Date: "2025-11-09"
Notes: "Tested on Chrome 119, localhost. All functionality working as expected."

Then move to "Execution Log" sheet:

Date: 2025-11-09
Test Session: Morning
Tester Name: Hung
Environment: localhost
Browser: Chrome 119
Test ID: TC-P0-001
Feature: Public Video Library
Status: Passed
Execution Time: 3 min
Comments: Quick test, no issues found
```

**IF THERE WAS A BUG:**
```
Example: Video count shows "undefined" instead of "5"

1. Mark test as FAILED
2. Go to "Bug Tracker" sheet
3. Create bug:

Bug ID: BUG-001
Related Test ID: TC-P0-001
Feature: Public Video Library
Severity: Medium
Priority: High
Status: Open
Summary: Video count shows "undefined" on category cards
Description: On /tools/knowledge page, some category cards show "undefined" instead of the actual video count
Steps to Reproduce:
  1. Navigate to /tools/knowledge
  2. Observe "Leadership" category card
  3. Expected count: "5 videos"
  4. Actual: "undefined videos"
Expected Behavior: Should display actual count from API (e.g., "5 videos")
Actual Behavior: Shows "undefined videos"
Environment: localhost
Browser: Chrome 119
Screenshot: screenshots/bug-001.png
Reported By: Hung
Reported Date: 2025-11-09

4. Take screenshot, save as bug-001.png
5. Notify developer via Slack/email
6. Continue testing next test case
```

---

## ✅ Sign-Off Criteria

**When is UAT Complete?**

Feature is considered **PASSED** when:
- ✅ All test cases executed (Status ≠ "Not Tested")
- ✅ Pass Rate ≥ 95%
- ✅ Zero Critical or High severity bugs
- ✅ All Medium bugs are acceptable or fixed
- ✅ Retest completed for all bug fixes
- ✅ Cross-browser testing done
- ✅ Performance acceptable (<3s page load)
- ✅ User acceptance gained (stakeholder approval)

**Ready for Production:**
```
□ All P0 features: 100% passed
□ All P1 features: 100% passed
□ All P2 features: ≥95% passed
□ All P3 features: ≥90% passed
□ Zero critical bugs open
□ Zero high bugs open
□ All retests verified
□ Documentation updated
□ Deployment plan reviewed
```

---

## 📚 Additional Resources

**Project Documentation:**
- `IMPLEMENTATION_STATUS.md` - Current status & commit history
- `PHASE2_EXTENDED_DESIGN.md` - Feature specifications
- `README.md` - Development setup guide

**Excel Learning:**
- [Excel Formulas Cheat Sheet](https://support.microsoft.com/excel)
- [Conditional Formatting Guide](https://support.microsoft.com/conditional-formatting)

**Testing Best Practices:**
- [UAT Best Practices Guide](https://www.softwaretestinghelp.com/user-acceptance-testing-uat/)
- [Bug Report Writing Tips](https://www.softwaretestinghelp.com/how-to-write-good-bug-report/)

---

**Created by:** Claude Code
**Last Updated:** November 9, 2025
**Version:** 1.0
