---
name: backend-coding-guidelines
description: Comprehensive Laravel backend coding guidelines for 4-layer architecture (DDD-lite). **CRITICAL**: Focuses on patterns AI commonly fails to implement correctly, especially Entity/ValueObject design, UseCase structure, and layer separation. Reference this skill when implementing or refactoring backend code during Phase 2.
---

# Backend Coding Guidelines - What AI Gets Wrong

This skill focuses on patterns AI commonly fails to implement correctly in Laravel applications following a 4-layer architecture (Presentation, Application, Domain, Infrastructure).

## Table of Contents

1. [How to Use This Skill](#how-to-use-this-skill)
2. [Architecture Overview](#architecture-overview)
3. [AI's Critical Weaknesses - Quick Reference](#ais-critical-weaknesses---quick-reference)
4. [Naming Conventions](#naming-conventions)
5. [Method Naming](#method-naming)
6. [Class Modifiers](#class-modifiers)
7. [Prohibited Patterns](#prohibited-patterns)
8. [AI Weakness Checklist](#ai-weakness-checklist)
9. [Summary: What to Watch For](#summary-what-to-watch-for)

---

## How to Use This Skill

This skill is designed for **Phase 2: Implementation & Review** in the development workflow.

### Recommended Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Implementation & Review                            │
└─────────────────────────────────────────────────────────────┘

Step 1: Pre-Implementation Check
├─ Review relevant sections below based on what you're building:
│  ├─ Building Entity/ValueObject? → Read Entity Design & ValueObject Design
│  ├─ Building UseCase? → Read UseCase Structure
│  ├─ Building Repository? → Read Repository Pattern
│  └─ Cross-module communication? → Read Module Isolation
│
Step 2: Implementation
├─ Implement following the correct patterns
├─ Avoid AI's common mistakes highlighted in Quick Reference
│
Step 3: Pre-Review Self-Check
├─ Run through AI Weakness Checklist
├─ Verify no prohibited patterns used
├─ Check layer separation rules
│
Step 4: Code Review (Codex MCP)
├─ Request code review with focus on patterns from this skill
└─ Fix any violations identified
```

### When to Reference Detailed Guides

The Quick Reference section below provides high-level patterns. For detailed examples and variations:

- **Entity Design**: See [references/entity-design.md](references/entity-design.md)
- **ValueObject Design**: See [references/valueobject-design.md](references/valueobject-design.md)
- **UseCase Structure**: See [references/usecase-structure.md](references/usecase-structure.md)
- **Repository Pattern**: See [references/repository-pattern.md](references/repository-pattern.md)
- **Layer Separation**: See [references/layer-separation.md](references/layer-separation.md)
- **Module Isolation**: See [references/module-isolation.md](references/module-isolation.md)

---

## Architecture Overview

**4-Layer Structure:**
- **Presentation Layer**: HTTP request/response handling (Controller, Request, Resource, Middleware)
- **Application Layer**: UseCase orchestration (UseCase, DTO)
- **Domain Layer**: Business logic/rules (Entity, ValueObject, DomainService, Repository Interface)
- **Infrastructure Layer**: Technical details (Repository Implementation, Eloquent Model, QueryBuilder)

**Dependency Direction:**
```
Presentation → Application → Domain ← Infrastructure
```
- Domain layer MUST NOT depend on any other layer
- Infrastructure implements Domain interfaces (Dependency Inversion)

---

## AI's Critical Weaknesses - Quick Reference

### 1. Entity Design ⚠️ MOST CRITICAL

**AI gets wrong**: Using public constructors and mutable properties

**Correct pattern**:
- Private constructor with `create()` and `reconstruct()` factory methods
- All properties `readonly` with ValueObject types
- Class marked as `final`

```php
// ✅ Correct pattern
final class Member
{
    private function __construct(
        private readonly MemberId $id,
        private readonly Name $name,
        private readonly Email $email,
    ) {}

    public static function create(Name $name, Email $email): self {
        return new self(MemberId::generate(), $name, $email);
    }

    public static function reconstruct(MemberId $id, Name $name, Email $email): self {
        return new self($id, $name, $email);
    }
}
```

👉 **Detailed guide**: [references/entity-design.md](references/entity-design.md)

---

### 2. ValueObject Design ⚠️

**AI gets wrong**: Skipping validation or using primitives in Entities

**Correct pattern**:
- Private constructor with `create()` factory method
- Validation at creation time
- Class marked as `final readonly`
- Has `value()` and `equals()` methods

```php
// ✅ Correct pattern
final readonly class Email
{
    private function __construct(private string $value) {}

    public static function create(string $value): self {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("無効なメールアドレス形式: {$value}");
        }
        return new self($value);
    }

    public function value(): string { return $this->value; }
    public function equals(self $other): bool { return $this->value === $other->value; }
}
```

👉 **Detailed guide**: [references/valueobject-design.md](references/valueobject-design.md)

---

### 3. UseCase Structure ⚠️

**AI gets wrong**: Business logic in controller, no DTOs, or returning Entities

**Correct pattern**:
- Input DTO for parameters (primitives)
- Output DTO for results (primitives)
- Uses Repository interface (not implementation)
- Class marked as `final readonly`

```php
// ✅ Correct pattern
final readonly class CreateMemberUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function execute(CreateMemberInput $input): CreateMemberOutput {
        $member = Member::create(
            name: Name::create($input->name),
            email: Email::create($input->email),
        );
        $this->repository->save($member);
        return new CreateMemberOutput(id: $member->id()->value());
    }
}
```

👉 **Detailed guide**: [references/usecase-structure.md](references/usecase-structure.md)

---

### 4. Repository Pattern ⚠️

**AI gets wrong**: Returning Eloquent Model or missing interface separation

**Correct pattern**:
- Interface in Domain layer (`MemberRepositoryInterface`)
- Implementation in Infrastructure layer (`EloquentMemberRepository`)
- Returns Entity (not Eloquent Model)
- Uses `reconstruct()` to build Entity from Model

```php
// ✅ Correct pattern
final class EloquentMemberRepository implements MemberRepositoryInterface
{
    public function findById(MemberId $id): ?Member {
        $model = MemberModel::find($id->value());
        if ($model === null) return null;

        return Member::reconstruct(
            id: MemberId::from($model->id),
            name: Name::create($model->name),
            email: Email::create($model->email),
        );
    }
}
```

👉 **Detailed guide**: [references/repository-pattern.md](references/repository-pattern.md)

---

### 5. Layer Separation ⚠️

**AI gets wrong**: Cross-layer dependencies (Domain → Laravel, UseCase → Eloquent, Controller → DB)

**Correct pattern**:
- Domain layer: Pure PHP, no Laravel dependencies
- Application layer: Uses Repository interfaces
- Controller: Uses UseCases only
- No cross-layer shortcuts

```php
// ✅ Correct: Domain layer is pure PHP
final class Member {
    // No use statements for Laravel classes
    // No database operations
    // Pure business logic only
}

// ✅ Correct: UseCase uses Repository interface
final readonly class ListMembersUseCase {
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}
}

// ✅ Correct: Controller uses UseCase
final class MemberController extends Controller {
    public function index(ListMembersUseCase $useCase): Response {
        $output = $useCase->execute();
        return Inertia::render('Members/Index', ['members' => $output->members]);
    }
}
```

👉 **Detailed guide**: [references/layer-separation.md](references/layer-separation.md)

---

### 6. Module Isolation ⚠️

**AI gets wrong**: Direct cross-module references to internal classes

**Correct pattern**:
- Contract interface in `modules/Contract/{Module}/`
- Contract DTOs use primitives
- Module implements Contract
- Other modules use Contract (not internals)

```php
// ✅ Correct: Use Contract for cross-module communication
// modules/Contract/Member/MemberServiceInterface.php
interface MemberServiceInterface {
    public function exists(string $id): bool;
}

// modules/Project/Application/UseCases/CreateProjectUseCase.php
use Modules\Contract\Member\MemberServiceInterface; // Via Contract

final readonly class CreateProjectUseCase {
    public function __construct(
        private MemberServiceInterface $memberService,
    ) {}
}
```

👉 **Detailed guide**: [references/module-isolation.md](references/module-isolation.md)

---

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Entity | `{Name}` | `Member`, `Project` |
| ValueObject | `{Name}` | `Email`, `MemberId`, `Name` |
| Repository Interface | `{Entity}RepositoryInterface` | `MemberRepositoryInterface` |
| Repository Impl | `Eloquent{Entity}Repository` | `EloquentMemberRepository` |
| UseCase | `{Action}{Entity}UseCase` | `CreateMemberUseCase` |
| Input DTO | `{Action}{Entity}Input` | `CreateMemberInput` |
| Output DTO | `{Action}{Entity}Output` | `CreateMemberOutput` |
| Controller | `{Entity}Controller` | `MemberController` |
| Request | `{Action}{Entity}Request` | `CreateMemberRequest` |
| Eloquent Model | `{Entity}Model` | `MemberModel` |

---

## Method Naming

| Purpose | Method Name |
|---------|-------------|
| Create new | `create` |
| Reconstruct from DB | `reconstruct` |
| Find single | `findById`, `findBy{Property}` |
| Find multiple | `findAll`, `findBy{Criteria}` |
| Save | `save` |
| Delete | `delete` |
| Get value | `value` |
| Compare equality | `equals` |

---

## Class Modifiers

```php
// Entity: final with private constructor
final class Member
{
    private function __construct(...) {}
}

// ValueObject: final readonly
final readonly class Email
{
    private function __construct(...) {}
}

// DTO: final readonly with public constructor
final readonly class CreateMemberInput
{
    public function __construct(...) {}
}

// UseCase: final readonly
final readonly class CreateMemberUseCase {}

// Repository Implementation: final
final class EloquentMemberRepository implements MemberRepositoryInterface {}

// Controller: final
final class MemberController extends Controller {}
```

---

## Prohibited Patterns

### In Domain Layer
- ❌ Eloquent Model usage
- ❌ Laravel Facades (`DB::`, `Cache::`, etc.)
- ❌ HTTP Request/Response
- ❌ External service calls
- ❌ File system operations

### In Application Layer
- ❌ Direct database queries
- ❌ Returning Entities to Presentation layer
- ❌ HTTP-specific logic

### In Controller
- ❌ Business logic
- ❌ Direct database access
- ❌ Data transformation (use UseCase for this)

---

## AI Weakness Checklist

Before considering implementation complete, verify AI didn't fall into these traps:

### Entity/ValueObject ⚠️ (Most Critical)
- [ ] Entity has `private` constructor with `create()` and `reconstruct()` factory methods
- [ ] ValueObject has validation in factory method
- [ ] All properties are `readonly`
- [ ] Class is marked as `final`
- [ ] Uses ValueObjects instead of primitives for Entity properties

### UseCase ⚠️
- [ ] Uses Input DTO for parameters
- [ ] Returns Output DTO (not Entity)
- [ ] Depends on Repository Interface (not implementation)
- [ ] No direct database access
- [ ] Marked as `final readonly`

### Repository ⚠️
- [ ] Interface defined in Domain layer
- [ ] Implementation in Infrastructure layer
- [ ] Uses `reconstruct()` to build Entity from model
- [ ] Returns Entity (not Eloquent Model)

### Layer Separation ⚠️
- [ ] Domain layer has no Laravel dependencies
- [ ] Application layer uses interfaces
- [ ] Controller only handles HTTP
- [ ] No cross-module internal references

### Controller ⚠️
- [ ] Uses method injection for UseCase
- [ ] No business logic
- [ ] Returns Inertia response with DTOs/arrays (not Entities)
- [ ] Uses FormRequest for validation

---

## Summary: What to Watch For

AI will confidently write code that:
1. **Uses public constructors** in Entities (should use factory methods)
2. **Skips ValueObjects** and uses primitives
3. **Returns Entities** from UseCases (should return Output DTOs)
4. **Returns Eloquent Models** from Repositories
5. **Puts business logic** in Controllers
6. **References other modules** directly (should use Contract)

**Trust AI for**:
- Basic PHP syntax
- Simple CRUD operations
- Controller routing

**Scrutinize AI for**:
- Entity/ValueObject design (factory methods required)
- UseCase structure (DTOs required)
- Layer boundaries (no cross-layer dependencies)
- Repository pattern (interface + implementation separation)

When in doubt, ask: **"Is each layer isolated with no illegal dependencies?"**
