---
mode: agent
model: Claude Sonnet 4
---

<!-- markdownlint-disable-file -->

# Implementation Prompt: Costco Dashboard Code Refactoring

## Implementation Instructions

### Step 1: Create Changes Tracking File

You WILL create `20260109-dashboard-refactoring-changes.md` in #file:../changes/ if it does not exist.

### Step 2: Execute Implementation

You WILL follow #file:../../.github/instructions/task-implementation.instructions.md if it exists, otherwise follow standard implementation practices.

You WILL systematically implement #file:../plans/20260109-dashboard-refactoring-plan.instructions.md task-by-task through all 7 phases.

You WILL follow ALL software engineering best practices:
- DRY (Don't Repeat Yourself)
- YAGNI (You Aren't Gonna Need It)  
- SOLID principles
- Gang of Four design patterns as specified
- Clean code principles

**CRITICAL**: You WILL stop after each Phase for user review unless explicitly told to continue.

**Implementation Order**:
1. **Phase 1**: Project Infrastructure & Utilities (4 tasks) - LOW RISK
2. **Phase 2**: Service Layer Extraction (5 tasks) - MEDIUM RISK
3. **Phase 3**: Data Processing Layer (3 tasks) - MEDIUM RISK
4. **Phase 4**: Component Extraction (3 tasks) - HIGH RISK
5. **Phase 5**: Performance Optimization (3 tasks) - MEDIUM RISK
6. **Phase 6**: Testing Infrastructure (3 tasks) - LOW RISK
7. **Phase 7**: Documentation & Polish (3 tasks) - LOW RISK

**Quality Standards**:
- All functions under 50 lines
- All files under 300 lines
- Zero global variables
- **Comprehensive JSDoc on ALL code - write documentation inline as you code**
- 80%+ test coverage
- Zero ESLint errors (if using VS Code extension)
- **Minimal external dependencies - Chart.js only, no npm packages**
- **No build system - native ES6 modules with simple HTTP server**

### Step 3: Verification

After EACH task completion, you WILL:
1. Run relevant tests to ensure no regressions
2. Verify code quality (linting, formatting)
3. Update changes tracking file with specific changes made
4. Check off task in plan file

After EACH phase completion, you WILL:
1. Run full test suite
2. Verify all phase tasks are checked off
3. Provide phase summary to user
4. Wait for user approval before next phase

### Step 4: Cleanup

When ALL Phases are checked off (`[x]`) and completed you WILL do the following:

1. You WILL provide a markdown style link and a comprehensive summary of all changes from #file:../changes/20260109-dashboard-refactoring-changes.md to the user:
   - You WILL keep the overall summary brief but comprehensive
   - You WILL add spacing around any lists
   - You MUST wrap any reference to a file in a markdown style link
   - You WILL include metrics: files created, lines refactored, test coverage achieved

2. You WILL provide markdown style links to:
   - [Plan file](.copilot-tracking/plans/20260109-dashboard-refactoring-plan.instructions.md)
   - [Details file](.copilot-tracking/details/20260109-dashboard-refactoring-details.md)
   - [Research file](.copilot-tracking/research/20260109-dashboard-refactoring-research.md)
   
   You WILL recommend cleaning these files up as they are no longer needed.

3. **MANDATORY**: You WILL attempt to delete `.copilot-tracking/prompts/implement-dashboard-refactoring.prompt.md`

## Success Criteria

- [ ] Changes tracking file created and maintained
- [ ] All 7 phases implemented with working, tested code
- [ ] All 23 tasks completed and verified
- [ ] Design patterns properly implemented:
  - [ ] Factory Pattern (ChartService)
  - [ ] Strategy Pattern (FilterService)
  - [ ] Observer Pattern (StateManager)
  - [ ] Facade Pattern (API Client)
  - [ ] Singleton Pattern (Config)
  - [ ] Template Method Pattern (DataNormalizer)
- [ ] Performance benchmarks met:
  - [ ] Initial load < 2 seconds
  - [ ] Filter application < 500ms
  - [ ] Chart rendering < 300ms
  - [ ] Lighthouse score > 90
- [ ] Code quality standards met:
  - [ ] 80%+ test coverage
  - [ ] Zero ESLint errors
  - [ ] All functions < 50 lines
  - [ ] All files < 300 lines
  - [ ] No global variables
- [ ] Known bug fixed:
  - [ ] Returns/refunds calculation corrected
  - [ ] Regression test added
- [ ] Documentation complete:
  - [ ] **JSDoc written inline during development (not deferred to Phase 7)**
  - [ ] Every function, class, method documented with @param, @returns, @throws
  - [ ] Complex business logic has explanatory comments
  - [ ] README.md updated with simple setup instructions
  - [ ] ARCHITECTURE.md created with system overview
  - [ ] CONTRIBUTING.md created
- [ ] Project conventions followed
- [ ] Changes file updated continuously throughout implementation

## Important Notes

**Risk Management**:
- Phases 1, 6, 7 are LOW RISK - can proceed confidently
- Phases 2, 3, 5 are MEDIUM RISK - verify thoroughly before proceeding
- Phase 4 is HIGH RISK - component extraction requires extra care

**Testing**:
- Unit tests MUST be written alongside code, not after
- Integration tests after Phase 4 completion
- Regression test for bug fix in Phase 3

**Backward Compatibility**:
- Original dashboard_comprehensive.html should remain functional until Phase 4 complete
- Keep both versions working during transition
- Final cutover only after all tests pass

**Performance**:
- Measure baseline performance before Phase 5
- Verify improvements after each optimization
- Use Chrome DevTools Performance profiler

**Documentation**:
- **CRITICAL: Write JSDoc as you code, starting from Task 1.1**
- Every new function must have JSDoc before moving to next task
- Phase 7 is for final polish only, not initial documentation
- Update CHANGELOG.md for each significant change
- Keep README.md current throughout
- Document design pattern implementations with comments

**Minimal Dependencies (YAGNI)**:
- Use native browser features whenever possible
- Only external dependency: Chart.js (already in use)
- No Node.js, no npm, no build system
- Testing via browser-based approach
- Simple HTTP server for development (Python/PHP/Live Server)
