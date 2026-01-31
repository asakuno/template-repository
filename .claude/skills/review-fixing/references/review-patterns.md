# Review Comment Patterns

This document provides common patterns for handling different types of review comments.

## Pattern 1: Configuration File Changes

**Example Review Comment:**
```markdown
### **パッケージマネージャーの統一**
**優先度**: 高

**問題点**:
- `.gitignore` で `yarn.lock` を除外していますが、`package-lock.json` が追加されています。

**推奨対応**:
1. **npm を使用する場合**: `yarn.lock` を `.gitignore` に追加し、`package-lock.json` のみをコミット
2. **yarn を使用する場合**: `package-lock.json` を削除し、`yarn.lock` をコミット
```

**Handling Strategy:**
1. Identify which package manager is actually in use (check package.json scripts, CI/CD config)
2. Ask user for confirmation if unclear
3. Update .gitignore to exclude the unwanted lock file
4. Delete the unwanted lock file from git
5. Ensure the correct lock file is committed

**Implementation:**
```bash
# For yarn
git rm package-lock.json
# Update .gitignore to exclude package-lock.json
git add yarn.lock .gitignore
```

---

## Pattern 2: TypeScript Configuration Changes

**Example Review Comment:**
```markdown
### **TypeScript: exactOptionalPropertyTypes の無効化**
**優先度**: 中

**問題点**:
- `exactOptionalPropertyTypes` を `false` に設定していますが、strict mode の一部として有効化を推奨します。

**推奨対応**:
```typescript
"exactOptionalPropertyTypes": true,
```
```

**Handling Strategy:**
1. Read tsconfig.json to verify current setting
2. Change the specific setting value
3. Run typecheck to ensure no new errors
4. If errors occur, provide options:
   - Fix the errors (if simple)
   - Ask user if they want to proceed with fixes
   - Revert if errors are complex

**Implementation:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true  // Changed from false
  }
}
```

---

## Pattern 3: Adding Missing Configuration

**Example Review Comment:**
```markdown
### **Vite 設定: Path Alias の重複**
**優先度**: 低

**推奨対応**:
```javascript
// vite.config.js
import path from 'node:path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
});
```
```

**Handling Strategy:**
1. Read the target file to understand current structure
2. Identify where to insert the new configuration
3. Add necessary imports
4. Insert configuration in appropriate location
5. Preserve existing formatting and style

**Implementation Steps:**
1. Add `import path from 'node:path';` at the top
2. Add `resolve` object to the config
3. Ensure proper nesting and syntax

---

## Pattern 4: Severity Level Changes

**Example Review Comment:**
```markdown
### **Biome: noExplicitAny を warn に設定**
**優先度**: 中

**推奨対応**:
```json
"noExplicitAny": "error",
```
```

**Handling Strategy:**
1. Locate the rule in the configuration file
2. Change the severity level value
3. Run linter to check for newly surfaced errors
4. If errors appear, decide whether to:
   - Fix all errors now
   - Fix incrementally
   - Ask user for preference

---

## Pattern 5: Test Coverage Threshold Refinement

**Example Review Comment:**
```markdown
### **テストカバレッジ閾値の一貫性**

**推奨**: カスタムフック・ユーティリティには 80% の閾値を適用するため、`coverage.thresholds` を細分化することを検討してください。

```typescript
coverage: {
  thresholds: {
    'resources/js/hooks/**': {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
},
```
```

**Handling Strategy:**
1. Read vitest.config.ts or jest.config.js
2. Locate existing thresholds configuration
3. Add granular thresholds by path pattern
4. Ensure proper TypeScript typing
5. Test that configuration is valid

**Important Notes:**
- Different testing frameworks have different threshold syntaxes
- Vitest uses glob patterns for path matching
- Jest uses regex patterns
- Always verify the configuration syntax for the specific tool

---

## Pattern 6: Multi-File Coordinated Changes

**Example Review Comment:**
```markdown
### **パッケージマネージャーの統一**
**優先度**: 高

**必要な変更**:
1. .gitignore の更新
2. package-lock.json の削除
3. yarn.lock の追加
```

**Handling Strategy:**
1. **Plan the sequence**: Some operations must happen in specific order
2. **Make atomic changes**: Use git to ensure consistency
3. **Verify together**: All related files should be checked together
4. **Report as a unit**: Treat as one logical change

**Implementation Order:**
```bash
# 1. Update .gitignore first
# 2. Remove unwanted file from git
# 3. Add correct file to git
# 4. Verify all changes together
```

---

## Pattern 7: Optional/Discussion Items

**Example Review Comment:**
```markdown
## 📋 その他の観察事項

### **テストカバレッジ閾値の一貫性**
- 推奨: カスタムフック・ユーティリティには 80% の閾値を適用することを検討してください。
```

**Handling Strategy:**
1. **Present to user**: These are suggestions, not requirements
2. **Explain benefits**: Help user understand the value
3. **Offer to implement**: But don't proceed without explicit approval
4. **Document decision**: Note whether user accepted or deferred

---

## Edge Cases and Special Situations

### When Review Comments Conflict

If two review comments suggest conflicting changes:
1. Present both to user with explanation
2. Ask which approach to take
3. Explain pros/cons if needed
4. Proceed with user's choice only

### When Implementation is Complex

If fixing an item requires significant refactoring:
1. Explain the scope to user
2. Estimate the impact
3. Offer alternatives if available
4. Get explicit approval before proceeding

### When Tests Fail After Fix

If a fix causes test failures:
1. Analyze whether failure is related to the change
2. If related: Fix the test or the implementation
3. If unrelated: Report to user, may indicate pre-existing issue
4. Never commit failing tests

### When Review is Ambiguous

If a review comment is unclear or could mean multiple things:
1. Don't guess
2. Present your interpretation to user
3. Ask for clarification
4. Only proceed after confirmation

---

## Common Review Comment Types

### Security Issues
- Input validation, SQL injection prevention, XSS prevention, CSRF protection, Authentication/authorization
- **Approach**: Treat as high priority, verify fix with security checklist

### Architecture Violations
- Layer dependency violations, Improper separation of concerns, Missing abstractions
- **Approach**: May require discussion with user about design trade-offs

### Code Quality
- Variable naming, Code duplication, Complex logic, Missing error handling
- **Approach**: Straightforward to fix, focus on readability

### Configuration Issues
- Missing settings, Incorrect values, Inconsistent configuration
- **Approach**: Verify correct values with user if not specified in review

---

## Security Considerations

レビューファイルの解析時には以下のセキュリティ対策を実施する。

### File Path Validation

1. **ファイル拡張子の検証**: `.md` ファイルのみ許可
2. **プロジェクトディレクトリ内に制限**: プロジェクトルート外へのアクセスを禁止
3. **ファイルサイズの確認**: 最大1MBまで
4. **ディレクトリトラバーサル対策**: `..` を含むパスを拒否

### Content Sanitization

- コードブロック内のコマンドを自動実行しない
- ファイルパスの参照は検証後にのみアクセス
- ユーザー確認なしに破壊的な操作を実行しない
