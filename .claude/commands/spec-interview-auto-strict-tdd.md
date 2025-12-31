---
description: 仕様インタビュー後、厳格なTDD（機能単位）でサブエージェント自動実装を開始
allowed-tools: Read, Write, Bash, Task
argument-hint: [機能の概要や目的]
---

# 仕様インタビュー & 厳格TDD自動実装

**このコマンドは機能単位の厳格なTDDサイクル（RED → GREEN → REFACTOR）を採用します。**

各機能ごとに以下を繰り返します：
1. RED: テスト作成 → コミット
2. GREEN: 最小限の実装 → コミット
3. REFACTOR: リファクタリング → コミット

## 入力された初期仕様
```
$ARGUMENTS
```

## フェーズ1: 要件インタビュー

**AskUserQuestionTool** を使用して、以下の情報を収集してください。
一度に最大4問まで質問可能です。

**質問1: プロジェクト種別**
- question: "プロジェクトの種別を教えてください"
- header: "種別"
- multiSelect: false
- options:
  - label: "新規作成"
    description: "全く新しいプロジェクトを作成"
  - label: "既存への追加"
    description: "既存プロジェクトに機能を追加"
  - label: "リファクタリング"
    description: "既存コードの改善"

**質問2: 技術スタック**
- question: "使用する技術を選択してください（複数選択可）"
- header: "技術"
- multiSelect: true
- options:
  - label: "Backend"
    description: "Laravel/PHP バックエンド"
  - label: "Frontend"
    description: "React/TypeScript フロントエンド"
  - label: "Fullstack"
    description: "Laravel + Inertia.js フルスタック"

**質問3: コア機能**
- question: "最も重要な機能は何ですか？"
- header: "主要機能"
- multiSelect: false
- options:
  - label: "CRUD操作"
    description: "データの作成・参照・更新・削除"
  - label: "フォーム処理"
    description: "ユーザー入力の検証・保存"
  - label: "API開発"
    description: "RESTful API エンドポイント"
  - label: "UI構築"
    description: "ユーザーインターフェース"

**質問4: 成果物とテスト**
- question: "必要な成果物を選択してください（複数選択可）"
- header: "成果物"
- multiSelect: true
- options:
  - label: "実装コード"
    description: "本体のソースコード"
  - label: "テストコード (推奨)"
    description: "ユニット・機能テスト"
  - label: "ドキュメント"
    description: "README・仕様書"

## フェーズ2: 仕様書の作成と保存

インタビュー完了後、仕様書を作成します。

1. `.claude/specs/` ディレクトリを作成（存在しない場合）:
   ```bash
   mkdir -p .claude/specs
   ```

2. 以下の形式で仕様書を作成：

```markdown
# 実装仕様書

## 目的
[1-2文で目的を記載]

## 要件
- [ ] [要件1]
- [ ] [要件2]
- [ ] [要件3]

## 技術仕様
- 言語:
- フレームワーク:
- 依存関係:

## 実装手順（機能単位で記載）
1. [機能1: 具体的な機能名]
2. [機能2: 具体的な機能名]
3. [機能3: 具体的な機能名]

**重要**: 実装手順は機能単位で細かく分割してください。
各機能ごとにRED → GREEN → REFACTORサイクルを実行します。

## 完了条件
- [ ] [条件1]
- [ ] [条件2]
```

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

インタビュー結果の技術スタックに基づいて、適切なagentで厳格なTDDサイクルを実行します。

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

  **重要**: 実装手順は機能単位で細かく分割してください。
  各機能がTDDサイクル（RED → GREEN → REFACTOR）で実装できる粒度にしてください。

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
- 機能単位の実装ステップ定義

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Phase 2: TDD実装サイクル（機能単位）**（Phase 1完了後に実行）

**Taskツール** を使用：
- subagent_type: "implement-review"
- description: "Frontend Phase 2: 厳格TDD実装（機能単位）"
- prompt: |
  Phase 1で作成した実装計画書（@DESIGN.md）に基づいて、厳格なTDDサイクルで実装してください。

  **重要**: 各機能ごとにRED → GREEN → REFACTORサイクルを実行し、それぞれコミットしてください。

  実装手順：
  1. DESIGN.mdの「実装手順」から機能リストを確認
  2. 各機能について以下のサイクルを実行：

    **RED（テスト作成）**:
    - 機能のVitest/RTLテストを作成
    - Storybook ストーリー作成（条件分岐・複雑なUIの場合）
    - テストが失敗することを確認（RED）
    - コミット:
      ```
      git add .
      git commit -m "test(frontend): [機能名] - テスト作成（RED）

      - Vitest/RTL テスト作成
      - [具体的なテスト内容]

      🤖 Generated with [Claude Code](https://claude.com/claude-code)

      Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
      ```

    **GREEN（最小限の実装）**:
    - テストをパスする最小限のコードを実装
    - Laravel Precognition フォーム実装（必要な場合）
    - テストが成功することを確認（GREEN）
    - コミット:
      ```
      git add .
      git commit -m "feat(frontend): [機能名] - 実装（GREEN）

      - [具体的な実装内容]
      - テスト通過確認

      🤖 Generated with [Claude Code](https://claude.com/claude-code)

      Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
      ```

    **REFACTOR（リファクタリング）**:
    - コード品質を向上（重複削除、命名改善、最適化）
    - Serena MCP でシンボルベース編集
    - テストが引き続き成功することを確認
    - Codex MCP でコードレビュー
    - コミット:
      ```
      git add .
      git commit -m "refactor(frontend): [機能名] - リファクタリング（REFACTOR）

      - [具体的なリファクタリング内容]
      - テスト通過確認

      🤖 Generated with [Claude Code](https://claude.com/claude-code)

      Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
      ```

  3. 次の機能へ進む（RED → GREEN → REFACTOR を繰り返す）

  完了したら、実装した機能リストと全テストがパスしたことを報告してください。

**Phase 3: Quality Checks**（Phase 2完了後に実行）

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

**エラーが発生した場合**:
1. エラーメッセージを確認
2. 該当箇所を修正
3. 再度 Quality Checks を実行
4. すべてパスしたら修正をコミット

**よくあるエラーと対処法**:
- `typecheck` 失敗: 型定義の不足 → 適切な型を追加
- `check` 失敗: Biome lint エラー → `bun run check --apply` で自動修正
- `test` 失敗: テストケースの不足または実装のバグ → 修正して再実行
- `build` 失敗: import エラーやビルド設定の問題 → エラーログを確認

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

  **重要**: 実装手順は機能単位で細かく分割してください。
  例（架空の商品管理機能の場合）: 「ProductId ValueObject」「CategoryId ValueObject」「ProductName ValueObject」など
  各機能がTDDサイクル（RED → GREEN → REFACTOR）で実装できる粒度にしてください。

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
- 機能単位の実装ステップ定義

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Phase 2: TDD実装サイクル（機能単位）**（Phase 1完了後に実行）

**Taskツール** を使用：
- subagent_type: "backend-implement-review"
- description: "Backend Phase 2: 厳格TDD実装（機能単位）"
- prompt: |
  Phase 1で作成した実装計画書（@DESIGN.md）に基づいて、厳格なTDDサイクルで実装してください。

  **重要**: 各機能ごとにRED → GREEN → REFACTORサイクルを実行し、それぞれコミットしてください。

  実装手順：
  1. DESIGN.mdの「実装手順」から機能リストを確認
  2. 各機能について以下のサイクルを実行：

    **RED（テスト作成）**:
    - 機能のUnit/Featureテストを作成
    - テストが失敗することを確認（RED）
    - コミット:
      ```
      git add .
      git commit -m "test(backend): [機能名] - テスト作成（RED）

      - Unit/Feature テスト作成
      - [具体的なテスト内容]

      🤖 Generated with [Claude Code](https://claude.com/claude-code)

      Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
      ```

    **GREEN（最小限の実装）**:
    - テストをパスする最小限のコードを実装
    - Entity/ValueObject/UseCase/Repository実装
    - テストが成功することを確認（GREEN）
    - コミット:
      ```
      git add .
      git commit -m "feat(backend): [機能名] - 実装（GREEN）

      - [具体的な実装内容]
      - テスト通過確認

      🤖 Generated with [Claude Code](https://claude.com/claude-code)

      Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
      ```

    **REFACTOR（リファクタリング）**:
    - コード品質を向上（重複削除、命名改善、最適化）
    - Serena MCP でシンボルベース編集
    - テストが引き続き成功することを確認
    - Codex MCP でコードレビュー
    - コミット:
      ```
      git add .
      git commit -m "refactor(backend): [機能名] - リファクタリング（REFACTOR）

      - [具体的なリファクタリング内容]
      - テスト通過確認

      🤖 Generated with [Claude Code](https://claude.com/claude-code)

      Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
      ```

  3. 次の機能へ進む（RED → GREEN → REFACTOR を繰り返す）

  完了したら、実装した機能リストと全テストがパスしたことを報告してください。

**Phase 3: Quality Checks**（Phase 2完了後に実行）

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

**エラーが発生した場合**:
1. エラーメッセージを確認
2. 該当箇所を修正
3. 再度 Quality Checks を実行
4. すべてパスしたら修正をコミット

**よくあるエラーと対処法**:
- `phpstan` 失敗: 型定義の不足、潜在的バグ → 適切な型を追加、コードを修正
- `pint` 失敗: コーディング規約違反 → `./vendor/bin/pint` で自動修正
- `phpunit` 失敗: テストケースの不足または実装のバグ → 修正して再実行
- `deptrac` 失敗: 依存関係の違反 → 4層アーキテクチャに従って修正

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

**実行順序**: Backend（厳格TDD） → Frontend（厳格TDD）

1. **Backend Phase 1**（backend-plan-reviewer） - 計画・設計
2. **Backend Phase 2**（backend-implement-review） - 厳格TDDサイクル（機能単位）
   - 機能1: RED → GREEN → REFACTOR
   - 機能2: RED → GREEN → REFACTOR
   - ...
3. **Backend Phase 3**（Quality Checks） - バックエンドの品質チェック
4. **Frontend Phase 1**（plan-reviewer） - 計画・設計
5. **Frontend Phase 2**（implement-review） - 厳格TDDサイクル（機能単位）
   - 機能1: RED → GREEN → REFACTOR
   - 機能2: RED → GREEN → REFACTOR
   - ...
6. **Frontend Phase 3**（Quality Checks） - フロントエンドのテスト・品質チェック

**重要事項**:
- 各フェーズは前のフェーズの完了を待ってから実行
- Phase 2では各機能ごとにRED → GREEN → REFACTORサイクルを厳守
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
この仕様書に基づいて厳格なTDD（機能単位）で実装を開始してください。

実装タイプに応じて適切なagentを使用：
- Frontend: /plan-reviewer → /implement-review（厳格TDD）
- Backend: /backend-plan-reviewer → /backend-implement-review（厳格TDD）

各機能ごとにRED → GREEN → REFACTORサイクルを実行し、それぞれコミットしてください。
```
---

### 選択肢3の場合（現在のセッション）

実装タイプを確認し、適切なワークフローで実装を開始してください：

- **Frontend**: ui-design-guidelines、coding-guidelines を参照
- **Backend**: backend-architecture-guidelines、backend-coding-guidelines を参照
- **Fullstack**: Backend完了後にFrontend実装

**重要**: 各機能ごとにRED → GREEN → REFACTORサイクルを実行し、それぞれコミットしてください。
