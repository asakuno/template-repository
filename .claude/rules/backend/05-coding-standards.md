---
paths:
  - modules/**/*.php
  - app/**/*.php
---

# バックエンド コーディング規約

## 基本設定

すべての PHP ファイルで `declare(strict_types=1)` を宣言する。

## クラス命名

Entity は `{Name}`、ValueObject は `{Name}` とする。Repository Interface は `{Entity}RepositoryInterface`、Repository 実装は `Eloquent{Entity}Repository` とする。UseCase は `{Action}{Entity}UseCase`、DTO は `{Action}{Entity}Input` / `{Action}{Entity}Output` とする。Controller は `{Entity}Controller`、Request は `{Action}{Entity}Request`、Eloquent Model は `{Entity}Model` とする。

## メソッド命名

生成（新規）は `create`、復元（DB から）は `reconstruct` とする。単一取得は `findById` または `findBy{Property}`、保存は `save`、削除は `delete` とする。値取得は `value`、等価判定は `equals` とする。

## 修飾子の使用

継承を想定しないクラスには `final` を付与する。ValueObject、DTO には `readonly` を付与する。Entity、ValueObject のコンストラクタには `private` を付与する。

## 依存関係の静的解析（deptrac）

モジュール間・レイヤー間の依存関係は deptrac で静的解析し、CI で検証する。

```yaml
# deptrac/module.yaml
deptrac:
  paths:
    - ./modules
  ruleset:
    Contract: [Contract]
    Member: [Contract, Member]
    Project: [Contract, Project]
```

```yaml
# deptrac/layer.yaml
deptrac:
  ruleset:
    Presentation: [Presentation, Application]
    Application: [Application, Domain]
    Domain: [Domain]
    Infrastructure: [Infrastructure, Domain]
```

## 禁止事項

型ヒントの省略、マジックナンバー、bare except、`else` の濫用は禁止する。
