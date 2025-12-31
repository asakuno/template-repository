---
description: 最小限の仕様からインタビューで詳細を収集し、実装セッションを開始
allowed-tools: Read, Write, Bash, Task
argument-hint: [機能の概要や目的]
---

# 仕様インタビュー & 実装セッション作成

## 入力された初期仕様
```
$ARGUMENTS
```

## フェーズ1: 要件インタビュー

上記の初期仕様を理解した上で、**AskUserQuestionTool** を使用して以下の観点から詳細をヒアリングしてください。

### インタビュー項目

@.claude/docs/interview-questions.md

## フェーズ2: 仕様書の作成

インタビュー結果を元に、以下の形式で仕様書を作成し `.claude/specs/` ディレクトリに保存してください。

@.claude/docs/spec-directory-setup.md

### 仕様書フォーマット

@.claude/docs/spec-template.md

## フェーズ3: 計画明確化インタビュー（任意）

仕様書（DESIGN.md）が作成されたら、必要に応じて計画の曖昧な点を深掘りして明確化できます。

**重要**: このフェーズは **planモード** で実行してください。planモードでは以下のツールが使用できます：
- Read, Edit, Write
- Grep, Glob
- TodoRead, TodoWrite
- AskUserQuestion

### 手順

1. **DESIGN.md の分析**
   - `.claude/specs/DESIGN.md` を読み込む
   - 不明確な点、曖昧な記述、決定が必要な項目を特定
   - 技術仕様、UI/UX、アーキテクチャの観点で確認

2. **質問の生成**

   **AskUserQuestionTool** を使用して以下のルールで質問を生成：

   <rules>
   - 質問数: **2-4個**（曖昧さのレベルに応じて調整）
   - 各質問に **2-4個の具体的な選択肢**
   - 各選択肢には **pros/cons を簡潔に記載**
   - オープンエンドな質問は避ける
   - "Other" 選択肢は自動追加されるため含めない
   - CLAUDE.md のパターンに沿った選択肢を提示
   </rules>

3. **回答の処理**

   ユーザーの回答を受け取ったら、以下の形式で決定事項を記録：

   <output_format>
   ## 決定事項

   | 項目 | 選択内容 | 理由 | 備考 |
   |------|---------|------|------|
   | データストレージ | Database | スケーラビリティが必要 | マイグレーション戦略を検討 |

   ## 次のステップ

   1. **DESIGN.md の更新**
      - 決定事項を反映
      - 曖昧だった部分を具体化
   </output_format>

4. **DESIGN.md の更新**

   決定事項を DESIGN.md に反映：
   - アーキテクチャ決定記録（ADR）セクションに追加
   - 実装手順を具体化
   - 技術スタックの詳細を明記

### 重要な注意事項

- **AskUserQuestion ツールを必ず使用** - 会話形式の質問ではなく構造化された質問
- **言語選択**: CLAUDE.md で言語設定を確認
- 各選択肢には必ず **pros/cons を含める**
- CLAUDE.md を読んでプロジェクトのパターンに沿った質問を生成

## フェーズ4: 実装セッションの準備

仕様書の保存が完了したら、ユーザーに以下を提示してください：

---

### 📋 仕様書が完成しました

**保存先:** `.claude/specs/[ファイル名]`

### 🚀 実装を開始するには

#### オプション1: 新しいセッションで実行（推奨）

以下のコマンドをコピーして新しいセッションで実行してください：

```
/clear
```

その後、実装タイプに応じて以下のプロンプトで実装を開始：

**Frontend実装の場合**:
```
@.claude/specs/[ファイル名]

この仕様書に基づいて実装を開始してください。

Phase 1: plan-reviewer で実装計画を作成
  → 完了後、計画ドキュメントをコミット:
    git add . && git commit -m "feat(frontend): Phase 1完了 - UI/UX設計と実装計画を作成

- UI/UXレビュー実施
- ハイブリッドアーキテクチャ設計
- コンポーネント設計
- 実装計画書（DESIGN.md）作成

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

Phase 2a: test-review でテスト作成（RED）
  → 完了後、テストファイルをコミット:
    git add . && git commit -m "test(frontend): Phase 2a完了 - TDD RED フェーズ テスト作成

- Vitest/RTL テスト作成
- コンポーネント振る舞いテスト
- フォームバリデーションテスト
- Storybook ストーリー作成
- テストケース設計完了

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

Phase 2b: implement-review で実装・リファクタリング（GREEN & REFACTOR）
  → 完了後、実装ファイルをコミット:
    git add . && git commit -m "feat(frontend): Phase 2b完了 - TDD GREEN & REFACTOR フェーズ 実装完了

- Pageコンポーネント実装
- UIコンポーネント実装
- Laravel Precognition フォーム実装
- 全テスト通過（GREEN）
- リファクタリング実施（REFACTOR）
- コードレビュー実施

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

Phase 3: Quality Checks を実行
  bun run typecheck && bun run check && bun run test && bun run build
  → すべてパス後、修正があればコミット:
    git add . && git commit -m "chore(frontend): Phase 3完了 - Quality Checks通過

- TypeScript型チェック通過
- Biome lint/format チェック通過
- Vitest テスト実行成功
- Vite ビルド確認完了

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Backend実装の場合（TDD）**:
```
@.claude/specs/[ファイル名]

この仕様書に基づいて実装を開始してください（TDD方式）。

Phase 1: backend-plan-reviewer で実装計画を作成
  → 完了後、計画ドキュメントをコミット:
    git add . && git commit -m "feat(backend): Phase 1完了 - 4層アーキテクチャ設計と実装計画を作成

- 4層アーキテクチャ設計（backend-architecture-guidelines準拠）
- Entity/ValueObject設計
- UseCase設計
- Repository Interface設計
- 実装計画書（DESIGN.md）作成

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

Phase 2a: backend-test-review でテスト作成（RED）
  → 完了後、テストファイルをコミット:
    git add . && git commit -m "test(backend): Phase 2a完了 - TDD RED フェーズ テスト作成

- Unit テスト作成（Domain層）
- Feature テスト作成（Application層）
- テストケース設計完了
- Repository Interface モック実装

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

Phase 2b: backend-implement-review で実装・リファクタリング（GREEN & REFACTOR）
  → 完了後、実装ファイルをコミット:
    git add . && git commit -m "feat(backend): Phase 2b完了 - TDD GREEN & REFACTOR フェーズ 実装完了

- Entity/ValueObject実装（create/reconstruct）
- UseCase実装（Input/Output DTO）
- Repository実装（Eloquent）
- Controller実装（Presentation層）
- 全テスト通過（GREEN）
- リファクタリング実施（REFACTOR）
- コードレビュー実施

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

Phase 3: Quality Checks を実行
  ./vendor/bin/phpstan analyse && ./vendor/bin/pint --test && ./vendor/bin/phpunit && ./vendor/bin/deptrac
  → すべてパス後、修正があればコミット:
    git add . && git commit -m "chore(backend): Phase 3完了 - Quality Checks通過

- PHPStan 静的解析通過
- Laravel Pint コーディング規約チェック通過
- PHPUnit テスト実行成功
- Deptrac 依存関係チェック通過

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Fullstack実装の場合（Backend TDD）**:
```
@.claude/specs/[ファイル名]

この仕様書に基づいて実装を開始してください。

実行順序:

【Backend（TDD: 4段階）】
1. Backend Phase 1: backend-plan-reviewer
   → 完了後コミット: feat(backend): Phase 1完了 - 4層アーキテクチャ設計と実装計画を作成

2. Backend Phase 2a: backend-test-review（テスト作成：RED）
   → 完了後コミット: test(backend): Phase 2a完了 - TDD RED フェーズ テスト作成

3. Backend Phase 2b: backend-implement-review（実装：GREEN & REFACTOR）
   → 完了後コミット: feat(backend): Phase 2b完了 - TDD GREEN & REFACTOR フェーズ 実装完了

4. Backend Phase 3: Quality Checks（Backend）
   ./vendor/bin/phpstan analyse && ./vendor/bin/pint --test && ./vendor/bin/phpunit && ./vendor/bin/deptrac
   → すべてパス後コミット: chore(backend): Phase 3完了 - Quality Checks通過

【Frontend（TDD: 4段階）】
5. Frontend Phase 1: plan-reviewer
   → 完了後コミット: feat(frontend): Phase 1完了 - UI/UX設計と実装計画を作成

6. Frontend Phase 2a: test-review（テスト作成：RED）
   → 完了後コミット: test(frontend): Phase 2a完了 - TDD RED フェーズ テスト作成

7. Frontend Phase 2b: implement-review（実装：GREEN & REFACTOR）
   → 完了後コミット: feat(frontend): Phase 2b完了 - TDD GREEN & REFACTOR フェーズ 実装完了

8. Frontend Phase 3: Quality Checks（Frontend）
   bun run typecheck && bun run check && bun run test && bun run build
   → すべてパス後コミット: chore(frontend): Phase 3完了 - Quality Checks通過

注: 各コミットメッセージの詳細は上記のBackend/Frontend実装例を参照してください。
```

---

#### オプション2: 現在のセッションで続行

現在のセッションでそのまま実装を続けることもできます。
実装タイプに応じて適切なガイドラインを参照してください：

- **Frontend**: ui-design-guidelines、coding-guidelines
- **Backend**: backend-architecture-guidelines、backend-coding-guidelines

---

**どちらを希望しますか？**
