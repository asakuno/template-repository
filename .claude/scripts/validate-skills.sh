#!/bin/bash
# スキル構造の検証スクリプト
# 全スキルのSKILL.mdとreferencesファイルの整合性を検証する
set -e

SKILLS_DIR=".claude/skills"
errors=0

echo "🔍 スキル構造を検証中..."

for skill_dir in "$SKILLS_DIR"/*/; do
  skill_name=$(basename "$skill_dir")
  skill_md="${skill_dir}SKILL.md"

  # SKILL.mdの存在確認
  if [ ! -f "$skill_md" ]; then
    echo "❌ ERROR: SKILL.md が見つかりません: $skill_dir"
    errors=$((errors + 1))
    continue
  fi

  # Required Referencesセクションの存在確認
  if ! grep -q "## Required References" "$skill_md"; then
    echo "⚠️  WARNING: 'Required References' セクションがありません: $skill_md"
  fi

  # バッククォートで囲まれた参照ファイルパスを抽出して存在確認
  grep -oP '`references/[^`*]+\.md`' "$skill_md" 2>/dev/null | sed 's/`//g' | sort -u | while read -r ref; do
    ref_path="${skill_dir}${ref}"
    if [ ! -f "$ref_path" ]; then
      echo "❌ ERROR: 参照ファイルが見つかりません: $ref_path (参照元: $skill_md)"
      # サブシェル内なのでファイル経由でエラーを伝達
      echo "1" >> /tmp/validate-skills-errors
    fi
  done
done

# サブシェルからのエラーを集計
if [ -f /tmp/validate-skills-errors ]; then
  errors=$((errors + $(wc -l < /tmp/validate-skills-errors)))
  rm -f /tmp/validate-skills-errors
fi

echo ""
if [ "$errors" -gt 0 ]; then
  echo "❌ 検証失敗: $errors 件のエラーが見つかりました"
  exit 1
else
  echo "✅ すべてのスキルの検証に成功しました"
  exit 0
fi
