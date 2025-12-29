# Module Structure and Isolation

This document explains how to organize modules and enforce module boundaries using the Contract pattern.

## Table of Contents
- [Directory Layout](#directory-layout)
- [Module Isolation Rules](#module-isolation-rules)
- [Contract Pattern](#contract-pattern)
- [Contract Definition](#contract-definition)
- [Contract Implementation](#contract-implementation)

---

## Directory Layout

```
modules/
├── Contract/                    # Cross-module public APIs
│   ├── Member/
│   │   ├── MemberServiceInterface.php
│   │   └── DTOs/
│   │       └── MemberDto.php
│   └── Project/
│       └── ProjectServiceInterface.php
│
├── Member/                      # Member module
│   ├── Presentation/
│   │   ├── Controllers/
│   │   │   └── MemberController.php
│   │   ├── Requests/
│   │   │   ├── CreateMemberRequest.php
│   │   │   └── UpdateMemberRequest.php
│   │   └── Resources/
│   │       └── MemberResource.php
│   ├── Application/
│   │   ├── UseCases/
│   │   │   ├── CreateMemberUseCase.php
│   │   │   ├── UpdateMemberUseCase.php
│   │   │   └── ListMembersUseCase.php
│   │   ├── DTOs/
│   │   │   ├── CreateMemberInput.php
│   │   │   ├── CreateMemberOutput.php
│   │   │   └── MemberListItem.php
│   │   └── Services/
│   │       └── MemberService.php  # Implements Contract
│   ├── Domain/
│   │   ├── Entities/
│   │   │   └── Member.php
│   │   ├── ValueObjects/
│   │   │   ├── MemberId.php
│   │   │   ├── Name.php
│   │   │   └── Email.php
│   │   ├── Repositories/
│   │   │   └── MemberRepositoryInterface.php
│   │   ├── Services/
│   │   │   └── MemberDomainService.php
│   │   └── Exceptions/
│   │       ├── MemberNotFoundException.php
│   │       └── DuplicateEmailException.php
│   └── Infrastructure/
│       ├── Repositories/
│       │   └── EloquentMemberRepository.php
│       └── Models/
│           └── MemberModel.php
│
└── Project/                     # Project module
    └── ...
```

---

## Module Isolation Rules

### Rule: Modules communicate ONLY through Contract

Modules must not directly reference another module's internal implementation. All cross-module communication must go through Contract interfaces.

### ❌ WRONG: Direct Cross-Module Reference

```php
namespace Modules\Project\Application\UseCases;

use Modules\Member\Domain\Entities\Member;  // Illegal!
use Modules\Member\Domain\Repositories\MemberRepositoryInterface;  // Illegal!

final readonly class CreateProjectUseCase
{
    public function __construct(
        private MemberRepositoryInterface $memberRepository,  // Wrong!
    ) {}
}
```

### ✅ CORRECT: Use Contract Interface

```php
namespace Modules\Project\Application\UseCases;

use Modules\Contract\Member\MemberServiceInterface;

final readonly class CreateProjectUseCase
{
    public function __construct(
        private MemberServiceInterface $memberService,  // Via Contract
        private ProjectRepositoryInterface $projectRepository,
    ) {}

    public function execute(CreateProjectInput $input): CreateProjectOutput
    {
        // Check member exists via Contract
        $member = $this->memberService->findById($input->ownerId);
        if ($member === null) {
            throw new MemberNotFoundException($input->ownerId);
        }

        // Create project
        $project = Project::create(
            name: ProjectName::create($input->name),
            ownerId: OwnerId::from($input->ownerId),
        );

        $this->projectRepository->save($project);

        return new CreateProjectOutput(id: $project->id()->value());
    }
}
```

---

## Contract Pattern

The Contract pattern provides a stable API for cross-module communication. Each module exposes a Contract interface that other modules can depend on.

**Key Principles**:
- Contract interfaces define what other modules can do with this module
- Contract DTOs are simple data structures (no business logic)
- Only Application layer services implement Contract interfaces
- Contracts change less frequently than internal implementations

---

## Contract Definition

Contracts are defined in `modules/Contract/{Module}/` and consist of:
- Service interface
- DTOs for data exchange

```php
// modules/Contract/Member/MemberServiceInterface.php
namespace Modules\Contract\Member;

interface MemberServiceInterface
{
    public function findById(string $id): ?MemberDto;
    public function exists(string $id): bool;
    public function findByEmail(string $email): ?MemberDto;
}

// modules/Contract/Member/DTOs/MemberDto.php
namespace Modules\Contract\Member\DTOs;

final readonly class MemberDto
{
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
    ) {}
}
```

---

## Contract Implementation

The owning module implements its Contract interface in the Application layer.

```php
// modules/Member/Application/Services/MemberService.php
namespace Modules\Member\Application\Services;

use Modules\Contract\Member\MemberServiceInterface;
use Modules\Contract\Member\DTOs\MemberDto;

final readonly class MemberService implements MemberServiceInterface
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function findById(string $id): ?MemberDto
    {
        $member = $this->repository->findById(MemberId::from($id));

        if ($member === null) {
            return null;
        }

        return new MemberDto(
            id: $member->id()->value(),
            name: $member->name()->value(),
            email: $member->email()->value(),
        );
    }

    public function exists(string $id): bool
    {
        return $this->repository->findById(MemberId::from($id)) !== null;
    }

    public function findByEmail(string $email): ?MemberDto
    {
        $member = $this->repository->findByEmail(Email::create($email));

        if ($member === null) {
            return null;
        }

        return new MemberDto(
            id: $member->id()->value(),
            name: $member->name()->value(),
            email: $member->email()->value(),
        );
    }
}
```

### Dependency Injection Binding

Register the Contract implementation in Laravel's service container:

```php
// app/Providers/AppServiceProvider.php
use Modules\Contract\Member\MemberServiceInterface;
use Modules\Member\Application\Services\MemberService;

public function register(): void
{
    $this->app->bind(MemberServiceInterface::class, MemberService::class);
}
```
