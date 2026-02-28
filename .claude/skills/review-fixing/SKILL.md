---
name: review-fixing
description: >
  Systematic approach to processing PR/code review comments and implementing fixes.
  Use when you receive review feedback in markdown format (e.g., code_review.md files)
  and need to: (1) Analyze review comments by priority, (2) Determine which items to fix,
  (3) Implement the fixes, (4) Run tests to verify changes, (5) External code review,
  (6) Report the results. Includes review loop pattern: implement → review → fix → repeat
  until clean. Triggers when users mention "PR review", "code review feedback", "review comments",
  "コードレビュー", "レビューコメント", "PRレビュー", "レビュー対応", "レビュー修正",
  or provide review markdown files (e.g., code_review.md, review.md).
---

# Review Fixing

## Required References

このスキルを読み込んだ後、以下のファイルをReadツールで読み込むこと。

**必須**（常に読み込む）:
- `references/review-patterns.md` - よくあるレビューコメント構造と対応パターン

---

## Overview

This skill provides a structured 6-step workflow for processing code review comments and implementing fixes. It helps Claude systematically analyze review feedback, prioritize items, implement changes, verify the fixes work correctly, and conduct external code review with a review loop pattern to ensure quality. The workflow includes:

1. **Parse Review Comments** - Analyze priority levels and categories
2. **Present Items to User** - Interactive selection of fixes to implement
3. **Implement Fixes** - Apply changes with minimal code modification
4. **Verify Changes** - Run linters, type checkers, and tests
5. **External Code Review** - Independent review with loop pattern (implement → review → fix → repeat)
6. **Report Results** - Comprehensive report including all review iterations

This implements the review loop pattern from tips.md, ensuring all critical issues are resolved before finalizing changes.

## Usage

**With file path argument:**
```
/review-fixing /home/takahiro/project/manage-app/memos/code_review.md
```

**Without argument (interactive):**
```
/review-fixing
```
The skill will search for review files in common locations (`memos/`, `docs/`, current directory) or ask user for the file path.

**Natural language:**
```
このレビューコメント（memos/code_review.md）を処理して修正してください
```

## Workflow

### 1. Parse Review Comments

**Get review file path:**
- If file path provided as argument: Use it directly
- If file path in user message: Extract and use it
- If no path provided: Search common locations (`memos/*.md`, `docs/*review*.md`, `./*review*.md`)
- If multiple files found: Ask user to select
- If no files found: Ask user for file path

**Read and analyze the review file** to understand:
- **Priority levels**: High (必須), Medium (推奨), Low (検討)
- **Issue categories**: Security, Architecture, Code Quality, Testing, Configuration
- **Required vs optional items**: Distinguish between blocking issues and improvements
- **Specific file paths and line numbers**: Identify exact locations to modify

Example review structure:
```markdown
## ⚠️ 改善が必要な点

### 1. **カテゴリ: 問題のタイトル**
**優先度**: 高/中/低

**問題点**:
- 具体的な問題の説明

**推奨対応**:
- 修正方法の提案
```

### 2. Present Items to User

Always present all review items to the user for confirmation before making any changes. Group items by priority:

```markdown
## 📋 レビューコメント確認

以下のレビューコメントが見つかりました。修正する項目を選択してください。

### ✅ 必須対応項目（優先度：高）
- [ ] 1. [カテゴリ] 問題タイトル
  - ファイル: path/to/file
  - 内容: 問題の概要

### 🔧 推奨対応項目（優先度：中）
- [ ] 2. [カテゴリ] 問題タイトル
  - ファイル: path/to/file
  - 内容: 問題の概要

### 💡 検討項目（優先度：低）
- [ ] 3. [カテゴリ] 問題タイトル
  - ファイル: path/to/file
  - 内容: 問題の概要
```

Use AskUserQuestion to let the user select which items to fix:

**Example implementation:**
```javascript
AskUserQuestion({
  questions: [{
    question: "以下のレビューコメントが見つかりました。修正する項目を選択してください。",
    header: "修正項目選択",
    options: [
      {
        label: "[高] パッケージマネージャーの統一",
        description: "ファイル: .gitignore, package-lock.json\n問題: npmとyarnが混在しています。\n推奨: yarnに統一してpackage-lock.jsonを削除"
      },
      {
        label: "[中] TypeScript設定の厳格化",
        description: "ファイル: tsconfig.json\n問題: exactOptionalPropertyTypes=false\n推奨: trueに変更して型安全性を向上"
      },
      {
        label: "[中] Biomeルールの厳格化",
        description: "ファイル: biome.json\n問題: noExplicitAnyがwarnレベル\n推奨: errorに変更してany型を禁止"
      },
      {
        label: "[低] カバレッジ閾値の細分化",
        description: "ファイル: vitest.config.ts\n問題: 全体で70%の閾値\n推奨: hooks/libは80%に設定"
      }
    ],
    multiSelect: true
  }]
})
```

**Guidelines:**
- Provide clear labels with priority level prefix ([高], [中], [低])
- Include file paths and concise problem/solution summary in description
- Allow multiple selection (multiSelect: true)
- Present items in priority order (high → medium → low)

### 3. Implement Fixes

For each selected item:

1. **Read the target file** to understand current implementation
2. **Apply the fix** using Edit tool with precise old_string/new_string
3. **Add comments** if the change requires explanation
4. **Track progress** using TodoWrite to update status

**Important guidelines:**
- Make minimal changes - only fix what was requested
- Preserve existing code style and formatting
- Don't refactor unrelated code
- If multiple approaches exist, ask user for preference

### 4. Verify Changes

After implementing fixes, run verification steps:

#### For Backend Changes (Laravel/PHP):
```bash
# 1. Type checking
./vendor/bin/phpstan analyse
# If errors: Review type issues, fix only those related to changes

# 2. Code style
./vendor/bin/pint --test
# If errors: Run ./vendor/bin/pint to auto-fix

# 3. Tests
./vendor/bin/phpunit
# If failures: Analyze stack trace, determine if related to changes

# 4. Architecture validation
./vendor/bin/deptrac
# If violations: Check layer dependencies match architecture rules
```

#### For Frontend Changes (React/TypeScript):
```bash
# 1. Type checking
yarn typecheck
# If errors: Review type issues, fix only those related to changes

# 2. Linting
yarn check
# If errors: Fix linting issues related to changes

# 3. Tests
yarn test
# If failures: Analyze failures, determine if related to changes

# 4. Build
yarn build
# If errors: Fix build errors related to changes
```

#### Verification Decision Tree

When verification fails:

1. **All checks pass** → Proceed to Step 5
2. **Unrelated failures** → Report to user, ask whether to proceed
3. **Related failures** → Fix the issue and re-run verification
4. **Test needs updating** → Ask user for approval before modifying test
5. **Complex fix required** → Explain scope to user, get approval before proceeding

---

### 5. External Code Review (Review Loop)

After verification passes, conduct an independent code review to ensure quality and identify any remaining issues.

#### Review Methods

Choose one of the following review methods based on project setup:

**Recommended approach:** Use **Option A (Codex CLI)** if available, otherwise use **Option B (Subagents)**.

**Option A: Codex CLI (Recommended - faster and more comprehensive)**

Use Codex CLI for AI-powered code review:

```bash
codex review --uncommitted
```

**Option B: Review Subagent (Frontend/Backend separated)**

Use dedicated review subagents based on the type of changes:

**For Frontend Changes (React/TypeScript):**

```bash
# Launch implement-review subagent for frontend review
Task(
  subagent_type='implement-review',
  description='Review frontend fixes',
  prompt='''
  Review the following frontend code changes:

  Changed files:
  - resources/js/components/Example.tsx
  - resources/js/hooks/useExample.ts

  Review criteria:
  1. Security: XSS vulnerabilities, unsafe HTML rendering
  2. Architecture: Component structure, props design, custom hook patterns
  3. Code Quality: Naming conventions, code duplication, complexity
  4. Test Coverage: Component tests, hook tests coverage
  5. TypeScript: Type safety, any type usage, interface design

  Reference: .claude/rules/frontend/ and coding-guidelines skill

  Report any issues found with severity (Critical/High/Medium/Low).
  '''
)
```

**For Backend Changes (Laravel/PHP):**

```bash
# Launch backend-implement-review subagent for backend review
Task(
  subagent_type='backend-implement-review',
  description='Review backend fixes',
  prompt='''
  Review the following backend code changes:

  Changed files:
  - app/UseCases/Example/CreateExampleUseCase.php
  - app/Repositories/Example/ExampleRepository.php

  Review criteria:
  1. Security: SQL injection, XSS, CSRF, authentication/authorization
  2. Architecture: 7-layer architecture compliance, layer dependencies (deptrac)
  3. Code Quality: SOLID principles, naming conventions, duplication
  4. Test Coverage: UseCase tests, Repository tests coverage
  5. Type Safety: PHPDoc, type declarations, readonly usage

  Reference: .claude/rules/backend/ and backend-coding-guidelines skill

  Report any issues found with severity (Critical/High/Medium/Low).
  '''
)
```

**For Mixed Changes (Frontend + Backend):**

Run both subagents sequentially:

```bash
# 1. Review backend changes
Task(subagent_type='backend-implement-review', ...)

# 2. Review frontend changes
Task(subagent_type='implement-review', ...)
```

#### Review Loop Pattern

Implement the review loop pattern inspired by tips.md:

```
┌─────────────────────────────────────────────┐
│ Step 3: Implement Fixes                     │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Step 4: Verify Changes (lint/test)          │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│ Step 5: External Code Review                │
│  - Codex CLI or quality-check-expert         │
│  - Identify remaining issues                │
└──────────────────┬──────────────────────────┘
                   ↓
            ┌──────────────┐
            │ Issues found? │
            └──────┬───────┘
                   ↓
        ┌──────────┴──────────┐
        │ YES                 │ NO
        ↓                     ↓
┌───────────────┐    ┌────────────────┐
│ Back to Step 3│    │ Proceed to     │
│ Fix issues    │    │ Step 6: Report │
└───────────────┘    └────────────────┘
```

#### Loop Termination Conditions

レビューループは以下の条件で終了する：

| 条件 | アクション | 次のステップ |
|------|----------|------------|
| **Critical/High issues なし** | ループ終了 | Step 6: Report へ進む |
| **最大3回のループ到達** | ユーザーに報告 | 残存問題をレポートし判断を仰ぐ |
| **Medium 以下のみ残存** | ユーザーに確認 | 修正するか延期するか選択 |

**ループカウント管理:**
- 各ループでTodoWriteにループ回数を記録
- 3回目で警告メッセージをユーザーに表示
- 例: `[Review Loop 3/3] Critical issues remain. Manual intervention required.`

**無限ループ防止:**
```javascript
if (loopCount >= 3 && hasCriticalIssues) {
  // ユーザーに報告し、手動介入を要請
  AskUserQuestion({
    question: "3回のレビューループでもCritical issueが解決できませんでした。どうしますか？",
    options: [
      { label: "手動で修正を試みる", description: "問題箇所を確認し、手動で修正" },
      { label: "このまま進める", description: "Criticalを残したまま次へ（非推奨）" },
      { label: "中止する", description: "変更をrevertして中止" }
    ]
  })
}
```

---

#### Handling Review Feedback

When the external review identifies issues:

1. **Critical/High severity**: Must fix before proceeding
   - Return to Step 3
   - Implement fixes for review findings
   - Re-run Step 4 (Verify Changes)
   - Re-run Step 5 (External Code Review)
   - Repeat until clean

2. **Medium severity**: Ask user whether to fix now or defer
   - If fix now: Return to Step 3
   - If defer: Document in report, proceed to Step 6

3. **Low severity**: Document in report as improvement suggestions
   - Proceed to Step 6
   - Include in report for future consideration

4. **No issues found**: Proceed to Step 6

**Important**: The review loop ensures that all critical issues are resolved before finalizing changes. This aligns with TDD principles and quality-first development practices.

---

### 6. Report Results

Provide a comprehensive report including all stages of the review fixing process:

```markdown
## ✅ 修正完了レポート

### 修正した項目
1. ✅ [カテゴリ] 問題タイトル
   - ファイル: path/to/file
   - 変更内容: 簡潔な説明

2. ✅ [カテゴリ] 問題タイトル
   - ファイル: path/to/file
   - 変更内容: 簡潔な説明

### 検証結果（Step 4）
- ✅ 型チェック: パス
- ✅ Lint: パス
- ✅ テスト: パス
- ✅ ビルド: パス

### 外部レビュー結果（Step 5）
- ✅ コードレビュー: クリーン
- 🔄 レビューループ回数: 2回
- 📝 修正した問題:
  - 1回目: [Security] XSS脆弱性の修正
  - 2回目: [Code Quality] 命名規約の改善

### 未対応の項目
- 📝 [カテゴリ] 問題タイトル (ユーザーが選択しなかった項目)
- 💡 [Low] 改善提案 (外部レビューで提案された低優先度の改善)
```

**Report Guidelines:**
- Document all review loop iterations
- Include issues found and fixed during external review
- Distinguish between initial review fixes and external review fixes
- List any deferred items with reasons

## Best Practices

### When Analyzing Review Comments

- **Read carefully**: Don't assume - verify what the review actually says
- **Understand context**: Look at related code to understand the full picture
- **Clarify ambiguity**: If a suggestion is unclear, ask user before implementing
- **Check dependencies**: Some fixes may require updating multiple files

### When Implementing Fixes

- **One item at a time**: Complete and verify each fix before moving to the next
- **Test incrementally**: Run relevant tests after each significant change
- **Preserve intent**: Don't change the meaning of the code, only the implementation
- **Document if needed**: Add comments for non-obvious changes

### When Things Go Wrong

- **Tests fail**: Analyze the failure, fix if related to your change, or ask user
- **Conflicts arise**: If multiple fixes conflict, present options to user
- **Unclear requirements**: Don't guess - ask for clarification
- **Breaking changes**: Warn user before implementing potentially breaking changes

詳細なレビューコメント種別、セキュリティ対策、パターン例は `references/review-patterns.md` を参照。
