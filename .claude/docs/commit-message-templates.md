# コミットメッセージテンプレート集

## Frontend実装用テンプレート

### Phase 1完了（Planning & Review）

```
feat(frontend): Phase 1完了 - UI/UX設計と実装計画を作成

- UI/UXレビュー実施
- ハイブリッドアーキテクチャ設計
- コンポーネント設計
- 実装計画書（DESIGN.md）作成

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Phase 2a完了（TDD RED - テスト作成）

```
test(frontend): Phase 2a完了 - TDD RED フェーズ テスト作成

- Vitest/RTL テスト作成
- コンポーネント振る舞いテスト
- フォームバリデーションテスト
- Storybook ストーリー作成
- テストケース設計完了

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Phase 2b完了（TDD GREEN & REFACTOR - 実装）

```
feat(frontend): Phase 2b完了 - TDD GREEN & REFACTOR フェーズ 実装完了

- Pageコンポーネント実装
- UIコンポーネント実装
- Laravel Precognition フォーム実装
- 全テスト通過（GREEN）
- リファクタリング実施（REFACTOR）
- コードレビュー実施

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Phase 3完了（Quality Checks）

```
chore(frontend): Phase 3完了 - Quality Checks通過

- TypeScript型チェック通過
- Biome lint/format チェック通過
- Vitest テスト実行成功
- Vite ビルド確認完了

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Backend実装用テンプレート（TDD）

### Phase 1完了（Planning & Review）

```
feat(backend): Phase 1完了 - 4層アーキテクチャ設計と実装計画を作成

- 4層アーキテクチャ設計（backend-architecture-guidelines準拠）
- Entity/ValueObject設計
- UseCase設計
- Repository Interface設計
- 実装計画書（DESIGN.md）作成

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Phase 2a完了（TDD RED - テスト作成）

```
test(backend): Phase 2a完了 - TDD RED フェーズ テスト作成

- Unit テスト作成（Domain層）
- Feature テスト作成（Application層）
- テストケース設計完了
- Repository Interface モック実装

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Phase 2b完了（TDD GREEN & REFACTOR - 実装）

```
feat(backend): Phase 2b完了 - TDD GREEN & REFACTOR フェーズ 実装完了

- Entity/ValueObject実装（create/reconstruct）
- UseCase実装（Input/Output DTO）
- Repository実装（Eloquent）
- Controller実装（Presentation層）
- 全テスト通過（GREEN）
- リファクタリング実施（REFACTOR）
- コードレビュー実施

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Phase 3完了（Quality Checks）

```
chore(backend): Phase 3完了 - Quality Checks通過

- PHPStan 静的解析通過
- Laravel Pint コーディング規約チェック通過
- PHPUnit テスト実行成功
- Deptrac 依存関係チェック通過

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Phase単位TDD用テンプレート（厳格版）

### RED（テスト作成）

```
test([scope]): [Phase名] テスト作成 (RED)

- [テストファイル1]
- [テストファイル2]
- [テストファイル3]

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**例**:
```
test(backend): Domain層 テスト作成 (RED)

- EmailTest.php
- PasswordTest.php
- UserIdTest.php
- NameTest.php

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### GREEN（実装）

```
feat([scope]): [Phase名] 実装完了 (GREEN)

- [実装ファイル1]
- [実装ファイル2]
- [実装ファイル3]
- 全テスト通過

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**例**:
```
feat(backend): Domain層 実装完了 (GREEN)

- Email.php
- Password.php
- UserId.php
- Name.php
- 全テストがパス

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### REFACTOR（リファクタリング）

```
refactor([scope]): [Phase名] リファクタリング (REFACTOR)

- Laravel Pint 適用
- コーディング規約統一
- [その他の改善内容]
- 全テスト引き続きパス

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**例**:
```
refactor(backend): Domain層 リファクタリング (REFACTOR)

- Laravel Pint 適用
- コーディング規約統一
- PHPDoc コメント追加
- 全テスト引き続きパス

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## エラー修正用テンプレート

### Phase実装中の修正

```
fix([scope]): Phase [X]修正 - [修正内容]

[前Phase実装中に発見した問題を修正]

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Quality Checks修正

```
fix([scope]): Quality Checks修正 - [修正内容]

[エラー詳細や修正理由]

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## コミットタイプの選択ガイド

| タイプ | 用途 |
|--------|------|
| `feat` | 新機能の実装、Phase完了（Planning除く） |
| `test` | テストファイルの追加・修正（RED phase） |
| `refactor` | リファクタリング（REFACTOR phase） |
| `fix` | バグ修正、エラー対応 |
| `chore` | ビルド設定、依存関係、Quality Checks |
| `docs` | ドキュメントのみの変更 |

## スコープの選択ガイド

| スコープ | 対象 |
|---------|------|
| `frontend` | フロントエンド全般 |
| `backend` | バックエンド全般 |
| `auth` | 認証機能 |
| `api` | API関連 |
| `ui` | UIコンポーネント |
| `test` | テスト全般 |

---

## 使用上の注意

### テンプレートのカスタマイズ

- `[scope]` は実装対象に応じて変更
- 箇条書き部分は実際の実装内容に合わせて調整
- Phase名は具体的に記載（例: Domain層、基本UIコンポーネント）

### 一貫性の維持

- プロジェクト内で統一されたフォーマットを使用
- Claude Code署名とCo-Authored-Byは必ず含める
- CLAUDE.mdに従い、絵文字は使用しない

### コミットメッセージの品質

- 何を実施したか明確に記載
- 箇条書きで具体的な成果物を列挙
- 50文字以内の簡潔なタイトル行
