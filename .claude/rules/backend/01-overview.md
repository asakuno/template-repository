# バックエンド アーキテクチャ概要

## 基本方針

本プロジェクトは、**クリーンアーキテクチャ**を基盤とした**7層のレイヤード・アーキテクチャ**を採用する。

### 設計原則

- **SOLID原則の遵守**
- **型安全性の重視**（PHPDoc、Type Hints、DTOs、TypeScript自動生成）
- **テスト駆動開発（TDD）の推奨**
- **Inertia.js + React によるフロントエンド/バックエンド分離**

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **Backend** | Laravel 12 (PHP 8.4+) |
| **Frontend** | React + TypeScript, Inertia.js |
| **Database** | MySQL 8.0 |
| **Queue** | Redis |
| **Storage** | MinIO (S3互換) |
| **Testing** | PHPUnit 11 |
| **Code Style** | Laravel Pint |
| **型生成** | spatie/laravel-data, spatie/laravel-typescript-transformer, fumeapp/modeltyper |
| **ルート共有** | Laravel Wayfinder |

---

## アーキテクチャ構造

### 7層のレイヤード・アーキテクチャ

```
┌─────────────────────────────────────────┐
│  Presentation Layer (Controllers)       │  ← HTTP Request/Response
├─────────────────────────────────────────┤
│  Request Layer (Form Requests)          │  ← Validation & DTO Conversion
├─────────────────────────────────────────┤
│  Use Case Layer (Business Logic)        │  ← Application Logic
├─────────────────────────────────────────┤
│  Service Layer (Shared Logic)           │  ← Reusable Business Logic
├─────────────────────────────────────────┤
│  Repository Layer (Data Access)         │  ← Data Abstraction
├─────────────────────────────────────────┤
│  Model Layer (Eloquent Models)          │  ← Domain Models
├─────────────────────────────────────────┤
│  Resource Layer (Response Transformation) │  ← JSON Serialization
└─────────────────────────────────────────┘
```

### 各層の責務と依存方向

| レイヤー | 責務 | 依存方向 |
|---------|------|---------|
| **Presentation (Controllers)** | HTTPリクエストの受付・レスポンス返却 | → Request, UseCase, Resource |
| **Request (Form Requests)** | バリデーション、DTO変換 | → DTO |
| **Use Case** | ビジネスロジック、トランザクション制御 | → Repository, Service, Policy |
| **Service** | 汎用的なビジネスロジック | → Repository, Model |
| **Repository** | データアクセス抽象化 | → Model |
| **Model** | ドメインモデル、データ永続化 | なし（最下層） |
| **Resource** | JSONレスポンス変換 | → Model |

---

## ディレクトリ構造

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Controller.php              # ベースコントローラー
│   │   ├── Api/                        # API Controllers（REST API）
│   │   │   └── [Resource]Controller.php
│   │   └── Web/                        # Web Controllers（Inertia.js用）
│   │       └── [Resource]PageController.php
│   │
│   ├── Requests/                       # Form Requests
│   │   └── [Resource]/
│   │       ├── Store[Resource]Request.php
│   │       ├── Update[Resource]Request.php
│   │       └── Search[Resource]sRequest.php
│   │
│   ├── Resources/                      # API Resources
│   │   └── [Resource]Resource.php
│   │
│   └── Middleware/
│       └── HandleInertiaRequests.php   # Inertia共通データ
│
├── UseCases/                           # Use Cases
│   └── [Resource]/
│       ├── Create[Resource]UseCase.php
│       ├── Update[Resource]UseCase.php
│       ├── Delete[Resource]UseCase.php
│       └── Get[Resource]sUseCase.php
│
├── Services/                           # Services
│   └── [Resource]/
│       └── [Resource]ExportService.php
│
├── Repositories/                       # Repositories
│   └── [Resource]/
│       ├── [Resource]RepositoryInterface.php
│       └── [Resource]Repository.php
│
├── Data/                               # DTOs（Laravel Data）
│   └── [Resource]/
│       ├── Create[Resource]Data.php
│       └── Update[Resource]Data.php
│
├── Models/                             # Eloquent Models
│   └── [Resource].php
│
├── Policies/                           # Policies（認可）
│   └── [Resource]Policy.php
│
├── Enums/                              # Enums（列挙型）
│   └── [Resource]/
│       └── [Status].php
│
├── Exceptions/                         # Exceptions
│   └── Domain/
│       └── [Resource]NotFoundException.php
│
└── Utils/                              # ユーティリティ
    └── ModelTransformer.php            # TypeScript型生成用
```

---

## データフロー

### Web Controllers（Inertia.js）のフロー

**目的**: 初期ページ描画のみを担当。静的なマスターデータのみを提供。

```
Web Request → Web Controller → Inertia::render() → React Component
                                                         ↓
                                             （動的データが必要な場合）
                                                         ↓
                                                  API Request
```

### API Controllers（REST API）のフロー

**目的**: CRUD操作、動的データの取得・更新を担当。

```
API Request → API Controller → Form Request → Use Case
                                                  ↓
                                        Repository / Service
                                                  ↓
                                            Model (Eloquent)
                                                  ↓
                                              Resource
                                                  ↓
                                           JSON Response
```

---

## 基本ルール

### 依存方向

- **下位層から上位層への依存は禁止**
- **同一層内での依存は最小限に**
- **Interface を介した依存性逆転**（Repository など）

### 命名規則

| 種類 | 命名規則 | 例 |
|------|---------|-----|
| **Web Controller** | `[Resource]PageController.php` | `PostPageController.php` |
| **API Controller** | `[Resource]Controller.php` | `PostController.php` |
| **Form Request** | `Store/Update[Resource]Request.php` | `StorePostRequest.php` |
| **Use Case** | `[Action][Resource]UseCase.php` | `CreatePostUseCase.php` |
| **Service** | `[Resource][Function]Service.php` | `PostExportService.php` |
| **Repository Interface** | `[Resource]RepositoryInterface.php` | `PostRepositoryInterface.php` |
| **Repository** | `[Resource]Repository.php` | `PostRepository.php` |
| **DTO** | `Create/Update[Resource]Data.php` | `CreatePostData.php` |
| **Model** | `[Resource].php` | `Post.php` |
| **Resource** | `[Resource]Resource.php` | `PostResource.php` |
| **Policy** | `[Resource]Policy.php` | `PostPolicy.php` |

---

## 禁止事項

### 共通禁止事項

- **型宣言の省略**（すべての public メソッドに型宣言を必須とする）
- **`any` 型の使用**（TypeScript）
- **マジックナンバー**（定数化またはEnum使用）
- **Controller での直接的なDB アクセス**
- **Controller でのビジネスロジック実装**
- **Eloquent Model を Domain 層に直接返す**

### レイヤー間の禁止事項

- **Model が Repository に依存**
- **Use Case が Resource に依存**
- **Controller が Model に直接アクセス**（Repository 経由必須）
