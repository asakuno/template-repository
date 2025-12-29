---
paths:
  - modules/**/*.php
---

# バックエンド アーキテクチャ規約

## 4層アーキテクチャ

Presentation 層は HTTP リクエスト/レスポンス処理を担当し、Controller、Request、Resource、Middleware を配置する。Inertia レスポンスもこの層で返す。

Application 層はユースケースの実行を担当し、UseCase、DTO を配置する。

Domain 層はビジネスロジック・ルールを担当し、Entity、ValueObject、DomainService、Factory、Repository Interface を配置する。

Infrastructure 層は技術的詳細を担当し、Repository 実装、Eloquent Model、QueryBuilder を配置する。

## 依存ルール

依存の方向は `Presentation → Application → Domain ← Infrastructure` とする。Domain 層は他のいかなる層にも依存してはならない。Infrastructure 層は Domain 層のインターフェースを実装する（依存性逆転の原則）。

## モジュール間依存

各モジュールは Contract と自身にのみ依存できる。他モジュールの内部実装への直接参照は禁止とする。

```php
// ❌ NG: 他モジュールの内部実装を直接参照
use Modules\Member\Domain\Entities\Member;

// ✅ OK: Contract 経由でアクセス
use Modules\Contract\Member\MemberServiceInterface;
```

## ディレクトリ構成

```
modules/
├── Contract/{Module}/           # モジュール間の公開API
├── {Module}/
│   ├── Presentation/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Application/
│   │   ├── UseCases/
│   │   └── DTOs/
│   ├── Domain/
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   ├── Repositories/        # Interface のみ
│   │   └── Exceptions/
│   └── Infrastructure/
│       ├── Repositories/        # 実装クラス
│       └── Models/
```
