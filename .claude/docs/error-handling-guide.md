# エラーハンドリングガイド

## エラー発生時の対応フロー

### Phase実装中のエラー

#### 1. 即座に修正可能な場合
修正して同じPhase内で進める。

**例**:
- タイポや簡単な構文エラー
- import文の不足
- 軽微な型エラー

**対応**:
```bash
# エラーを修正後、同じPhaseの作業を続行
# コミットは通常のPhaseのタイミングで実施
```

#### 2. 設計変更が必要な場合
REFACTORステップで対応する。

**例**:
- コンポーネント構造の見直し
- 関数の分割・統合
- パフォーマンス改善

**対応**:
```bash
# GREEN（実装）を完了させる
git commit -m "feat: Phase X 実装完了 (GREEN)"

# REFACTORで設計変更を実施
# 修正後
git commit -m "refactor: Phase X リファクタリング (REFACTOR)"
```

#### 3. 前Phaseの修正が必要な場合
前Phaseに戻り、修正コミットを作成する。

**例**:
- Domain層のEntity設計ミス（Infrastructure層実装中に発見）
- ValueObjectのバリデーションロジックの不備
- Repository Interfaceのメソッド不足

**対応**:
```bash
# 現在のPhaseの作業を一時中断（未コミットの場合はstash）
git stash

# 前Phaseのファイルを修正
# 修正後、fix コミットを作成
git add .
git commit -m "fix(backend): Phase X修正 - [修正内容]

前Phase実装中に発見した問題を修正

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 中断していた作業を再開
git stash pop

# 現在のPhaseの作業を続行
```

---

## Quality Checksでのエラー対応

### 基本フロー

1. **エラーメッセージを分析**
2. **該当箇所を特定・修正**
3. **再度Quality Checksを実行**
4. **すべてパス後、修正コミットを作成**

### Frontend Quality Checks

```bash
bun run typecheck && bun run check && bun run test && bun run build
```

#### よくあるエラーと対処法

| エラー | 原因 | 対処法 |
|--------|------|--------|
| **typecheck失敗** | 型定義の不足 | 適切な型を追加 |
| **check失敗** | Biome lint エラー | `bun run check --apply` で自動修正 |
| **test失敗** | テストケースの不足または実装のバグ | 修正して再実行 |
| **build失敗** | import エラーやビルド設定の問題 | エラーログを確認して修正 |

#### 対応例

```bash
# typecheck エラーの場合
# 型定義を追加・修正
# 再度チェック
bun run typecheck

# check エラーの場合（自動修正を試す）
bun run check --apply
bun run check  # 再確認

# test エラーの場合
# テストまたは実装を修正
bun run test

# すべてパス後、修正コミット
git add .
git commit -m "fix(frontend): Quality Checks修正 - [修正内容]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Backend Quality Checks

```bash
./vendor/bin/phpstan analyse && ./vendor/bin/pint --test && ./vendor/bin/phpunit && ./vendor/bin/deptrac
```

#### よくあるエラーと対処法

| エラー | 原因 | 対処法 |
|--------|------|--------|
| **phpstan失敗** | 型定義の不足、潜在的バグ | 適切な型を追加、コードを修正 |
| **pint失敗** | コーディング規約違反 | `./vendor/bin/pint` で自動修正 |
| **phpunit失敗** | テストケースの不足または実装のバグ | 修正して再実行 |
| **deptrac失敗** | 依存関係の違反 | 4層アーキテクチャに従って修正 |

#### 対応例

```bash
# phpstan エラーの場合
# 型定義を追加・修正
# 再度チェック
./vendor/bin/phpstan analyse

# pint エラーの場合（自動修正を試す）
./vendor/bin/pint
./vendor/bin/pint --test  # 再確認

# phpunit エラーの場合
# テストまたは実装を修正
./vendor/bin/phpunit

# deptrac エラーの場合
# 依存関係を修正（例: Domain層からInfrastructure層への依存を削除）
./vendor/bin/deptrac

# すべてパス後、修正コミット
git add .
git commit -m "fix(backend): Quality Checks修正 - [修正内容]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## エラー対応の原則

### 1. 早期発見・早期対処
- こまめにテストを実行する
- Quality Checksは各Phase完了直後に実行する
- エラーを放置して次に進まない

### 2. 段階的な対応
- 一度に複数のエラーを修正しようとしない
- 1つのエラーを修正 → チェック実行 → 次のエラーへ

### 3. ドキュメント参照
- エラー内容が不明な場合はプロジェクトのガイドラインを確認
  - Frontend: `Skill('coding-guidelines')`, `Skill('test-guidelines')`
  - Backend: `Skill('backend-coding-guidelines')`, `Skill('backend-test-guidelines')`

### 4. コミットメッセージの明確化
- 何を修正したのか明確に記載
- Quality Checks修正の場合は `fix:` プレフィックスを使用

---

## トラブルシューティング

### すべてのQuality Checksが失敗する場合

1. **依存関係を確認**
   ```bash
   # Frontend
   bun install

   # Backend
   composer install
   ```

2. **設定ファイルを確認**
   - `tsconfig.json`, `biome.json`, `vite.config.ts` (Frontend)
   - `phpstan.neon`, `pint.json`, `deptrac.yaml` (Backend)

3. **キャッシュをクリア**
   ```bash
   # Frontend
   rm -rf node_modules/.cache
   bun run build

   # Backend
   php artisan cache:clear
   php artisan config:clear
   ```

### 特定のファイルでのみエラーが発生する場合

1. **ファイルパスを確認**
   - 命名規則に従っているか
   - 適切なディレクトリに配置されているか

2. **import/use文を確認**
   - 正しいパスを指定しているか
   - エイリアスが正しく設定されているか

3. **型定義を確認**
   - インターフェースやクラスの定義が正しいか
   - プロパティ名やメソッド名が一致しているか
