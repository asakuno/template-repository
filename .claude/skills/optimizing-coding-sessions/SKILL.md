---
name: optimizing-coding-sessions
description: コンテキスト枯渇・指示の無視・繰り返し修正失敗などの問題発生時に、Claude Code公式ベストプラクティスに基づきプロンプト設計・コンテキスト管理・セッション運用・CLAUDE.md最適化をガイドする。「ベストプラクティス」「効率的な使い方」「コンテキスト管理」「プロンプト改善」「CLAUDE.md最適化」で起動。
---

# コーディングセッション最適化ガイド

## Required References

このスキルを読み込んだ後、以下のファイルをReadツールで読み込むこと。

**必須**（常に読み込む）:
- `references/context-management.md` - コンテキスト管理、セッション運用、CLAUDE.md最適化、スケーリング戦略
- `references/prompting-patterns.md` - プロンプト設計パターン、検証戦略、インタビューパターン、4フェーズワークフロー

---

Claude Code公式ベストプラクティスに基づき、効果的な使い方をガイドする。

## 核心原則

**コンテキストウィンドウが最重要リソース**。すべてのベストプラクティスはこの制約に基づく。

## ワークフロー

### ステップ1: 現状の把握

ユーザーの課題を特定する：
- プロンプトの品質に問題があるか → `references/prompting-patterns.md`
- コンテキスト管理が不十分か → `references/context-management.md`
- セッション運用に改善余地があるか → `references/context-management.md`
- 検証戦略が不足しているか → `references/prompting-patterns.md`

### ステップ2: ガイダンス提供

課題に応じて適切なリファレンスを参照し、具体的な改善策を提示する。

### ステップ3: 実践的な改善提案

ユーザーの具体的なワークフローに合わせた改善を提案する。

### ステップ4: 効果の確認

改善が有効かを以下のチェックリストで検証する：

- [ ] CLAUDE.md変更の場合: 新セッションで問題が再現しないか確認したか
- [ ] プロンプト改善の場合: Before/After比較を提示し、ユーザーが試行したか
- [ ] コンテキスト管理の場合: `/clear` 後の再実行で改善を確認したか
- [ ] 改善提案が具体的で実行可能であるか
- [ ] 改善が不十分な場合、ステップ1に戻り別の課題を特定する

---

## 回避すべきアンチパターン

| パターン | 症状 | 対策 |
|---------|------|------|
| キッチンシンクセッション | 無関係なタスクが混在 | タスク間で `/clear`（詳細: `references/context-management.md`） |
| 繰り返し修正 | 2回以上の修正失敗 | `/clear` して改善したプロンプトで再開（詳細: `references/prompting-patterns.md`） |
| 肥大化CLAUDE.md | 指示が無視される | 不要な項目を削除、hooksに移行（詳細: `references/context-management.md`） |
| 検証なし実装 | エッジケース未対応 | テスト・スクリプト・スクリーンショットで検証（詳細: `references/prompting-patterns.md`） |
| 無制限の探索 | コンテキスト枯渇 | スコープを限定、サブエージェント使用（詳細: `references/context-management.md`） |

---

## 実行例

### 例1: CLAUDE.md最適化の相談

**ユーザー**: 「CLAUDE.mdが長くなりすぎて指示が無視される」

**対応**:
1. `references/context-management.md` を参照
2. CLAUDE.mdの各行を「削除してもClaudeが間違えるか？」で評価
3. 具体的な削除・移行候補を提示
4. Skills/hooksへの分離を提案

**具体的な改善差分の例**:
```diff
- # プロジェクト概要
- このプロジェクトはReactとTypeScriptで構築されたWebアプリケーションです。
- フロントエンドにはTailwind CSSを使用しています。
+ # プロジェクト概要
+ React/TypeScript + Tailwind CSS
```

### 例2: プロンプト改善

**ユーザー**: 「Claudeが意図と違うコードを書く」

**対応**:
1. `references/prompting-patterns.md` を参照
2. 具体性不足の箇所を特定
3. Before/After形式で改善例を提示
4. 改善したプロンプトで再実行し効果を確認
