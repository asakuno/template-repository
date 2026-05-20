---
description: "スキルを作成し、レビュー・自動修正まで行う"
argument-hint: "[スキル名] [スキルの説明]"
allowed-tools: ["Skill", "AskUserQuestion", "TodoWrite", "Read", "Glob", "Grep", "Bash"]
---

# /create-skill - スキル作成コマンド

このコマンドは、skill-creatorスキル（外部スキル: example-skills:skill-creator）を使って新しいスキルを作成し、
同スキルの検証スクリプトと設計原則でレビュー・自動修正を行います。

**注意**: このコマンドを実行する前に、example-skillsパッケージがインストールされていることを確認してください。

## 使い方

### 引数付き起動
```
/create-skill pdf-converter PDFファイルを画像に変換するスキル
```

### 引数なし起動（対話的）
```
/create-skill
```

---

## [1/3] スキル情報の取得

### 引数の解析

引数からスキル情報を取得します：
- `$1`: スキル名
- `$2`以降: スキルの説明

```
スキル名: $1
スキルの説明: $ARGUMENTS から $1 を除いた部分
```

$1が空の場合、AskUserQuestionツールを使用して以下を質問してください：

```javascript
AskUserQuestion({
  questions: [
    {
      question: "作成するスキルの名前を入力してください。\n\n例：\n- pdf-converter\n- code-review\n- data-analyzer",
      header: "スキル名",
      options: [
        {
          label: "名前を入力",
          description: "スキル名を直接入力"
        }
      ],
      multiSelect: false
    }
  ]
})
```

スキル名取得後、説明が空の場合も質問してください：

```javascript
AskUserQuestion({
  questions: [
    {
      question: "スキルの説明を入力してください。何を行うスキルですか？\n\n例：\n- PDFファイルを画像に変換し、OCR処理を行う\n- コードレビューを自動化し、改善点を提案する\n- データを分析してレポートを生成する",
      header: "スキル説明",
      options: [
        {
          label: "説明を入力",
          description: "スキルの説明を直接入力"
        }
      ],
      multiSelect: false
    }
  ]
})
```

---

## [2/3] スキルの作成

### TodoWriteでタスク管理

TodoWriteツールを使用してタスクを作成：

```javascript
TodoWrite({
  todos: [
    {
      content: "skill-creatorでスキルを作成",
      activeForm: "スキルを作成している",
      status: "in_progress"
    },
    {
      content: "skill-creatorの検証・設計原則でレビュー",
      activeForm: "スキルをレビューしている",
      status: "pending"
    },
    {
      content: "レビュー結果に基づいて自動修正",
      activeForm: "スキルを自動修正している",
      status: "pending"
    }
  ]
})
```

### skill-creatorの実行

Skillツールを使用してskill-creatorスキルを実行します：

```javascript
Skill({
  skill: "example-skills:skill-creator",
  args: "[スキル名] [スキルの説明]"
})
```

**重要**: skill-creatorが対話的に質問してくる場合は、ユーザーから取得した情報を元に回答してください。

### 作成完了の確認

スキルが正常に作成されたことを確認してください：
- SKILL.mdファイルが生成されたか
- 必要なディレクトリ構造が作成されたか

---

## [3/3] レビューと自動修正

### TodoWrite更新

```javascript
TodoWrite({
  todos: [
    {
      content: "skill-creatorでスキルを作成",
      activeForm: "スキルを作成している",
      status: "completed"
    },
    {
      content: "skill-creatorの検証・設計原則でレビュー",
      activeForm: "スキルをレビューしている",
      status: "in_progress"
    },
    {
      content: "レビュー結果に基づいて自動修正",
      activeForm: "スキルを自動修正している",
      status: "pending"
    }
  ]
})
```

### skill-creatorによるレビュー・検証

[2/3] で使用した skill-creator スキルの**検証スクリプト**と**設計原則**で、作成したスキルをレビューします。

1. **構造検証**: skill-creator の検証スクリプトを実行します（base ディレクトリは [2/3] の skill-creator スキルが提示するパス）。

   ```bash
   python3 <skill-creator>/scripts/quick_validate.py <作成したスキルのパス>
   # または（パッケージ化まで行う場合）
   python3 <skill-creator>/scripts/package_skill.py <作成したスキルのパス>
   ```

   YAMLフロントマター・命名規則（hyphen-case）・必須フィールド（name/description）・許可外キー・description長（≤1024字, 角括弧禁止）をチェックします。`pyyaml` 未導入で実行できない場合は、次の設計原則チェックで代替します。

2. **設計原則チェック**（skill-creator準拠）:
   - SKILL.md 本文が **500行以下**か（超過時は `references/` へ分割）
   - `description` に「何をするか」＋「いつ使うか（トリガー）」の両方が含まれるか
   - プログレッシブディスクロージャ（`references/` は1階層・SKILL.mdから直リンク、100行超のファイルは冒頭にTOC）
   - SKILL.md と `references/` で**情報が重複していない**か
   - README/INSTALLATION 等の**余分なドキュメントを作っていない**か

### レビュー結果の処理

**問題がない場合**：
1. TodoWriteですべてのタスクを完了にする
2. 完了サマリーを表示して終了

```javascript
TodoWrite({
  todos: [
    {
      content: "skill-creatorでスキルを作成",
      activeForm: "スキルを作成している",
      status: "completed"
    },
    {
      content: "skill-creatorの検証・設計原則でレビュー",
      activeForm: "スキルをレビューしている",
      status: "completed"
    },
    {
      content: "レビュー結果に基づいて自動修正",
      activeForm: "スキルを自動修正している",
      status: "completed"
    }
  ]
})
```

**問題がある場合**：
1. TodoWriteを更新して自動修正フェーズに移行
2. 指摘された問題を自動的に修正
3. 再度 skill-creator の検証・設計原則チェックを実行して確認
4. 問題がなくなるまで繰り返す（最大3回）

```javascript
TodoWrite({
  todos: [
    {
      content: "skill-creatorでスキルを作成",
      activeForm: "スキルを作成している",
      status: "completed"
    },
    {
      content: "skill-creatorの検証・設計原則でレビュー",
      activeForm: "スキルをレビューしている",
      status: "completed"
    },
    {
      content: "レビュー結果に基づいて自動修正",
      activeForm: "スキルを自動修正している",
      status: "in_progress"
    }
  ]
})
```

### 自動修正のルール

skill-creatorの検証・設計原則から指摘された問題を自動修正する際：

1. **構造的な問題**: ディレクトリ構造やファイル配置を修正
2. **内容の問題**: SKILL.mdの内容を修正・改善
3. **ベストプラクティス違反**: 推奨されるパターンに修正

**修正後は必ず再レビュー**を実行して、問題が解決されたことを確認してください。

---

## 完了サマリー

### サマリー表示

以下の情報を表示してください：

```
✓ スキルの作成が完了しました

スキル名: [スキル名]
説明: [スキルの説明]

作成されたファイル:
- [ファイルパスのリスト]

レビュー結果:
- [問題なし / N件の問題を自動修正]
```

---

## 重要な注意事項

### 自動修正の制限

- 最大3回まで自動修正を試行
- 3回試行しても問題が解決しない場合は、ユーザーに手動対応を依頼

### エラーハンドリング

- skill-creatorの実行エラー時は明確なエラーメッセージを表示
- 検証スクリプト（skill-creator）の実行エラー時はリトライオプションを提供
- 修正不可能な問題はユーザーに報告
