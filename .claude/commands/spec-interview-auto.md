---
description: 仕様インタビュー後、サブエージェントで自動実装を開始
allowed-tools: Read, Write, Bash, Task
argument-hint: [機能の概要や目的]
---

# 仕様インタビュー & 自動実装

## 入力された初期仕様
```
$ARGUMENTS
```

## フェーズ1: 要件インタビュー

@.claude/docs/interview-questions-auto.md

## フェーズ2: 仕様書の作成と保存

インタビュー完了後、仕様書を作成します。

1. `.claude/specs/` ディレクトリを作成（存在しない場合）:
   ```bash
   mkdir -p .claude/specs
   ```

2. 以下の形式で仕様書を作成：

@.claude/docs/spec-template-auto.md

3. ファイル名を生成：
   - タイムスタンプ: !`date +%Y%m%d-%H%M%S`
   - パス: `.claude/specs/spec-{タイムスタンプ}.md`

## フェーズ3: 実装方法の選択

仕様書保存後、**AskUserQuestionTool** で実装方法を確認：

**質問**: 実装をどのように進めますか？

**選択肢**:
1. **サブエージェントで自動実行** - Taskツールで独立したエージェントが実装を開始
2. **新しいセッションで手動実行** - /clear後に仕様書を参照して開始
3. **このセッションで続行** - 現在の会話内で実装を進める

## フェーズ4: 実装の実行

### 選択肢1の場合（サブエージェント）

インタビュー結果の技術スタックに基づいて、適切なagentを2段階で起動します。

#### Frontend実装の場合（React/TypeScript/Inertia.js）

**Phase 1: 計画・レビュー**

**Taskツール** を使用：
- subagent_type: "plan-reviewer"
- description: "Frontend Phase 1: 調査・計画"
- prompt: |
  以下の仕様書に基づいて、実装計画を作成してください。

  [仕様書の内容をここに展開]

  実施内容：
  - UI/UXレビュー（ui-design-guidelines準拠）
  - ハイブリッドアーキテクチャ設計（静的データはInertia Props、動的データはAPI）
  - コンポーネント設計（Page/Components/Layouts）
  - 実装計画書（DESIGN.md）の作成

  完了したら、計画内容を報告してください。

**Phase 1完了後のGitコミット**:

Phase 1が完了したら、以下のコマンドで計画ドキュメントをコミットしてください：

```bash
git add .
git commit -m "feat(frontend): Phase 1完了 - UI/UX設計と実装計画を作成

- UI/UXレビュー実施
- ハイブリッドアーキテクチャ設計
- コンポーネント設計
- 実装計画書（DESIGN.md）作成

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Phase 2a: テスト作成（RED）**（Phase 1完了後に実行）

**Taskツール** を使用：
- subagent_type: "test-review"
- description: "Frontend Phase 2a: テスト作成（TDD）"
- prompt: |
  Phase 1で作成した実装計画書（@DESIGN.md）に基づいて、テストを先に作成してください。

  **TDD RED フェーズ**：
  - テストケースの設計
  - Vitest/RTL テスト作成
    - コンポーネントの振る舞いテスト（まだ実装されていないのでREDになる）
    - フォームバリデーションテスト
    - ユーザーインタラクションテスト
  - Storybook ストーリー作成（条件分岐・複雑なUIの場合）

  目標：
  - 期待される動作を明確にテストで定義
  - テストは失敗する状態（RED）でOK
  - テストカバレッジ計画を立てる

  完了したら、作成したテストファイルの一覧を報告してください。

**Phase 2a完了後のGitコミット**:

Phase 2aが完了したら、以下のコマンドでテストファイルをコミットしてください：

```bash
git add .
git commit -m "test(frontend): Phase 2a完了 - TDD RED フェーズ テスト作成

- Vitest/RTL テスト作成
- コンポーネント振る舞いテスト
- フォームバリデーションテスト
- Storybook ストーリー作成
- テストケース設計完了

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Phase 2b: 実装・リファクタリング（GREEN & REFACTOR）**（Phase 2a完了後に実行）

**Taskツール** を使用：
- subagent_type: "implement-review"
- description: "Frontend Phase 2b: 実装・リファクタリング（TDD）"
- prompt: |
  Phase 2aで作成したテストをパスする実装を行ってください。

  **TDD GREEN & REFACTOR フェーズ**：
  - Pageコンポーネント実装
  - UIコンポーネント実装
  - Laravel Precognition フォーム実装
  - すべてのテストをパスさせる（GREEN）
  - コードをリファクタリング（REFACTOR）
  - Serena MCP でシンボルベース編集
  - Codex MCP でコードレビュー

  重要：
  - Phase 2aで作成したテストがすべてパスすることを確認
  - テストをパスさせるための最小限の実装から始める
  - リファクタリングでコード品質を向上

  完了したら、作成したファイルの一覧と全テストがパスしたことを報告してください。

**Phase 2b完了後のGitコミット**:

Phase 2bが完了したら、以下のコマンドで実装ファイルをコミットしてください：

```bash
git add .
git commit -m "feat(frontend): Phase 2b完了 - TDD GREEN & REFACTOR フェーズ 実装完了

- Pageコンポーネント実装
- UIコンポーネント実装
- Laravel Precognition フォーム実装
- 全テスト通過（GREEN）
- リファクタリング実施（REFACTOR）
- コードレビュー実施

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Phase 3: Quality Checks**（Phase 2b完了後に実行）

以下のコマンドをすべて実行し、すべてのチェックがパスすることを確認：

```bash
bun run typecheck && bun run check && bun run test && bun run build
```

**実行内容**:
- `bun run typecheck`: TypeScript型チェック
- `bun run check`: Biome lint/format チェック
- `bun run test`: Vitest テスト実行
- `bun run build`: Vite ビルド確認

**重要**: すべてのチェックがパスするまで次に進まない。
エラーが発生した場合は、エラーを修正してから再度実行。

**Phase 3完了後のGitコミット**:

Quality Checksがすべてパスしたら、以下のコマンドで修正をコミットしてください：

```bash
git add .
git commit -m "chore(frontend): Phase 3完了 - Quality Checks通過

- TypeScript型チェック通過
- Biome lint/format チェック通過
- Vitest テスト実行成功
- Vite ビルド確認完了

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**注意**: Phase 3で修正が不要だった場合（すべてのチェックが初回でパス）、このコミットは省略可能です。

---

#### Backend実装の場合（Laravel 4層アーキテクチャ）

**Phase 1: 計画・レビュー**

**Taskツール** を使用：
- subagent_type: "backend-plan-reviewer"
- description: "Backend Phase 1: 調査・計画"
- prompt: |
  以下の仕様書に基づいて、実装計画を作成してください。

  [仕様書の内容をここに展開]

  実施内容：
  - 4層アーキテクチャ設計（backend-architecture-guidelines準拠）
  - Entity/ValueObject設計
  - UseCase設計
  - Repository Interface設計
  - 実装計画書（DESIGN.md）の作成

  完了したら、計画内容を報告してください。

**Phase 1完了後のGitコミット**:

Phase 1が完了したら、以下のコマンドで計画ドキュメントをコミットしてください：

```bash
git add .
git commit -m "feat(backend): Phase 1完了 - 4層アーキテクチャ設計と実装計画を作成

- 4層アーキテクチャ設計（backend-architecture-guidelines準拠）
- Entity/ValueObject設計
- UseCase設計
- Repository Interface設計
- 実装計画書（DESIGN.md）作成

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Phase 2a: テスト作成（RED）**（Phase 1完了後に実行）

**Taskツール** を使用：
- subagent_type: "backend-test-review"
- description: "Backend Phase 2a: テスト作成（TDD）"
- prompt: |
  Phase 1で作成した実装計画書（@DESIGN.md）に基づいて、テストを先に作成してください。

  **TDD RED フェーズ**：
  - テストケースの設計
  - Unit テスト作成（Domain層）
    - Entity/ValueObjectのテスト（まだ実装されていないのでREDになる）
  - Feature テスト作成（Application層）
    - UseCaseのテスト（まだ実装されていないのでREDになる）
  - Repository Interfaceのモックを使用

  目標：
  - 期待される動作を明確にテストで定義
  - テストは失敗する状態（RED）でOK
  - テストカバレッジ計画を立てる

  完了したら、作成したテストファイルの一覧を報告してください。

**Phase 2a完了後のGitコミット**:

Phase 2aが完了したら、以下のコマンドでテストファイルをコミットしてください：

```bash
git add .
git commit -m "test(backend): Phase 2a完了 - TDD RED フェーズ テスト作成

- Unit テスト作成（Domain層）
- Feature テスト作成（Application層）
- テストケース設計完了
- Repository Interface モック実装

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Phase 2b: 実装・リファクタリング（GREEN & REFACTOR）**（Phase 2a完了後に実行）

**Taskツール** を使用：
- subagent_type: "backend-implement-review"
- description: "Backend Phase 2b: 実装・リファクタリング（TDD）"
- prompt: |
  Phase 2aで作成したテストをパスする実装を行ってください。

  **TDD GREEN & REFACTOR フェーズ**：
  - Entity/ValueObject実装（create/reconstruct）
  - UseCase実装（Input/Output DTO）
  - Repository実装（Eloquent）
  - Controller実装（Presentation層）
  - すべてのテストをパスさせる（GREEN）
  - コードをリファクタリング（REFACTOR）
  - Codex MCP でコードレビュー

  重要：
  - Phase 2aで作成したテストがすべてパスすることを確認
  - テストをパスさせるための最小限の実装から始める
  - リファクタリングでコード品質を向上

  完了したら、作成したファイルの一覧と全テストがパスしたことを報告してください。

**Phase 2b完了後のGitコミット**:

Phase 2bが完了したら、以下のコマンドで実装ファイルをコミットしてください：

```bash
git add .
git commit -m "feat(backend): Phase 2b完了 - TDD GREEN & REFACTOR フェーズ 実装完了

- Entity/ValueObject実装（create/reconstruct）
- UseCase実装（Input/Output DTO）
- Repository実装（Eloquent）
- Controller実装（Presentation層）
- 全テスト通過（GREEN）
- リファクタリング実施（REFACTOR）
- コードレビュー実施

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Phase 3: Quality Checks**（Phase 2b完了後に実行）

以下のコマンドをすべて実行し、すべてのチェックがパスすることを確認：

```bash
./vendor/bin/phpstan analyse && \
./vendor/bin/pint --test && \
./vendor/bin/phpunit && \
./vendor/bin/deptrac
```

**実行内容**:
- `phpstan analyse`: 静的解析（型チェック、潜在的バグ検出）
- `pint --test`: コーディング規約チェック（Laravel Pint）
- `phpunit`: PHPUnit テスト実行
- `deptrac`: 依存関係チェック（4層アーキテクチャ検証）

**重要**: すべてのチェックがパスするまで次に進まない。
エラーが発生した場合は、エラーを修正してから再度実行。

**Phase 3完了後のGitコミット**:

Quality Checksがすべてパスしたら、以下のコマンドで修正をコミットしてください：

```bash
git add .
git commit -m "chore(backend): Phase 3完了 - Quality Checks通過

- PHPStan 静的解析通過
- Laravel Pint コーディング規約チェック通過
- PHPUnit テスト実行成功
- Deptrac 依存関係チェック通過

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**注意**: Phase 3で修正が不要だった場合（すべてのチェックが初回でパス）、このコミットは省略可能です。

---

#### Fullstack実装の場合（Laravel + Inertia.js）

**実行順序**: Backend（TDD: 4段階） → Frontend（TDD: 4段階）

1. **Backend Phase 1**（backend-plan-reviewer） - 計画・設計
2. **Backend Phase 2a**（backend-test-review） - テスト作成（RED）
3. **Backend Phase 2b**（backend-implement-review） - 実装・リファクタリング（GREEN & REFACTOR）
4. **Backend Phase 3**（Quality Checks） - バックエンドの品質チェック
5. **Frontend Phase 1**（plan-reviewer） - 計画・設計
6. **Frontend Phase 2a**（test-review） - テスト作成（RED）
7. **Frontend Phase 2b**（implement-review） - 実装・リファクタリング（GREEN & REFACTOR）
8. **Frontend Phase 3**（Quality Checks） - フロントエンドのテスト・品質チェック

**重要事項**:
- 各フェーズは前のフェーズの完了を待ってから実行
- Backend Phase 2a（テスト作成）→ Phase 2b（実装）の順序を厳守（TDD）
- Frontend Phase 2a（テスト作成）→ Phase 2b（実装）の順序を厳守（TDD）
- Backend Phase 3（Quality Checks）がパスしてから Frontend Phase 1 に進む
- バックエンドAPI実装完了後、フロントエンドでそのAPIを使用

---

### 選択肢2の場合（新しいセッション）

以下のメッセージを表示：

---
📝 **仕様書を保存しました**

新しいセッションを開始するには：

1. `/clear` を入力してセッションをクリア
2. 以下をコピーして貼り付け：

```
@.claude/specs/[保存したファイル名]
この仕様書に基づいて実装を開始してください。

実装タイプに応じて適切なagentを使用：
- Frontend: /plan-reviewer → /implement-review
- Backend: /backend-plan-reviewer → /backend-implement-review
```
---

### 選択肢3の場合（現在のセッション）

実装タイプを確認し、適切なワークフローで実装を開始してください：

- **Frontend**: ui-design-guidelines、coding-guidelines を参照
- **Backend**: backend-architecture-guidelines、backend-coding-guidelines を参照
- **Fullstack**: Backend完了後にFrontend実装
