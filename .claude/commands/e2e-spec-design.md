---
description: "画面仕様書からE2Eテスト仕様書を生成"
argument-hint: "<画面仕様書パス> (例: docs/specs/login-screen.md)"
allowed-tools: ["Read", "Write", "Glob", "AskUserQuestion", "Skill"]
---

# /e2e-spec-design - E2Eテスト仕様書作成コマンド

画面仕様書（Markdown/Excel）からE2Eテスト仕様書を生成する。生成したテスト仕様書は `/e2e-spec-impl` でPlaywrightテストコードに変換可能。

---

## [1/4] 入力ファイル解析

### 仕様書パスの取得

```
仕様書パス: $1
```

$1が空の場合、ユーザーに質問：

「テスト仕様書を作成する画面仕様書のパスを入力してください。
対応形式: Markdown (.md), Excel (.xlsx)
例: docs/specs/auth/login.md」

### 仕様書の読み込み

Readツールで仕様書を読み込み、以下を特定：

1. **画面情報**: 画面ID、画面名、URL、認証要否
2. **画面要素**: フォーム要素、表示要素、ナビゲーション要素
3. **機能一覧**: 主要機能、副次機能

### 対象画面の確認

複数画面が含まれる場合、AskUserQuestionで対象画面を確認：

```javascript
AskUserQuestion({
  questions: [{
    question: "テスト仕様書を作成する画面を選択してください。",
    header: "対象画面",
    options: [
      { label: "[画面名1]", description: "[概要]" },
      { label: "[画面名2]", description: "[概要]" },
      { label: "すべて", description: "検出したすべての画面" }
    ],
    multiSelect: true
  }]
})
```

---

## [2/4] テストケース設計

### スキル参照

```javascript
Skill({ skill: "playwright-guidelines" })
```

### テストケースの抽出

選択された各画面に対して、以下のテストケースを設計：

| 分類 | 内容 |
|------|------|
| **正常系** | 基本フロー、代替フロー、オプショナルフロー |
| **異常系** | バリデーションエラー、認証エラー、サーバーエラー |
| **境界値** | 空入力、最大長、特殊文字 |

### 優先度の設定

| 優先度 | 条件 | 例 |
|--------|------|-----|
| 高 | クリティカルパス、主要機能の正常系 | ログイン成功 |
| 中 | エラーハンドリング、準主要機能 | バリデーションエラー |
| 低 | エッジケース、UI詳細確認 | 特殊文字入力 |

### テストケース確認

```javascript
AskUserQuestion({
  questions: [{
    question: "テストケースを設計しました：\n\n- 正常系: X件\n- 異常系: Y件\n- 境界値: Z件\n\nこの構成で進めてよろしいですか？",
    header: "テストケース確認",
    options: [
      { label: "承認", description: "このテストケースで生成" },
      { label: "高優先度のみ", description: "優先度「高」のみ生成" },
      { label: "却下", description: "コマンドを終了" }
    ],
    multiSelect: false
  }]
})
```

---

## [3/4] テスト仕様書生成

### 出力先

```
tests/e2e/specs/{category}/{screen}.spec.md
```

- category: 画面の分類（auth, dashboard 等）
- screen: 画面名（kebab-case）

### テスト仕様書フォーマット

**Skill('playwright-guidelines')** のテスト仕様書フォーマット（SKILL.md 83-108行）に従って作成：

- 画面概要（画面ID、画面名、URL、認証）
- 前提条件
- テストケーステーブル（テストID、テスト名、前提条件、操作手順、期待結果、優先度）
- データ要件（テストデータ、Laravelファクトリー）
- Page Object要件

**テストID命名規則**: `{CATEGORY}_{SCREEN}_{連番}` または `{CATEGORY}_{SCREEN}_{種別}_{連番}`

---

## [4/4] 完了と次ステップ

### サマリー表示

```
✓ テスト仕様書が生成されました

生成ファイル: tests/e2e/specs/{category}/{screen}.spec.md

テストケース数:
- 正常系: X件, 異常系: Y件, 境界値: Z件
- 合計: N件（高: A件, 中: B件, 低: C件）

推定Page Object: {Category}{Screen}Page
```

### 次のアクション確認

```javascript
AskUserQuestion({
  questions: [{
    question: "次のアクションを選択してください。",
    header: "次のアクション",
    options: [
      { label: "テストコード生成 (Recommended)", description: "/e2e-spec-impl でPlaywrightテストを生成" },
      { label: "レビュー指摘を反映", description: "テスト仕様書を修正" },
      { label: "完了", description: "テスト仕様書作成のみで終了" }
    ],
    multiSelect: false
  }]
})
```

**「テストコード生成」選択時**:
```javascript
Skill({ skill: "e2e-spec-impl", args: "tests/e2e/specs/{category}/{screen}.spec.md" })
```

**「レビュー指摘を反映」選択時**:
ユーザーの修正指示を受け取り、仕様書を修正後、再度「次のアクション確認」に戻る。

---

## 重要な注意事項

### テスト仕様書作成のルール

1. **テストIDは一意に**: `{CATEGORY}_{SCREEN}_{連番}` 形式
2. **操作手順は具体的に**: 再現可能な手順を記述
3. **期待結果は検証可能に**: 「"ログイン成功"メッセージが表示される」のように具体的に
4. **前提条件は明確に**: 認証状態、データ状態を明示

### playwright-guidelinesとの連携

- **セレクタ戦略**: ロールベースロケーターを想定
- **AAAパターン**: Arrange-Act-Assert の構造を意識
- **テスト独立性**: 各テストケースが独立して実行可能
