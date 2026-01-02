# UseCase Structure - Input/Output DTOs and Orchestration

## AI's Common Failure Patterns

### Pattern 1: Business Logic in Controller

**❌ AI writes: Logic in controller**

```php
final class MemberController extends Controller
{
    public function store(Request $request)
    {
        // Business logic in controller
        $member = new Member();
        $member->name = $request->input('name');
        $member->email = $request->input('email');
        $member->save();

        return redirect()->route('members.index');
    }
}
```

**Problems**:
- Business logic mixed with HTTP handling
- Hard to test (requires HTTP request)
- Can't reuse logic (CLI, API, etc.)
- Violates Single Responsibility Principle

### Pattern 2: UseCase Returns Entity Directly

**❌ AI writes: UseCase returns Entity directly**

```php
final readonly class CreateMemberUseCase
{
    public function execute(string $name, string $email): Member
    {
        $member = Member::create(
            name: Name::create($name),
            email: Email::create($email),
        );

        $this->repository->save($member);

        return $member; // Exposing Entity to Presentation layer
    }
}
```

**Problems**:
- Exposes Domain Entity to Presentation layer
- Breaks layer separation
- Controller gets access to Entity methods
- Hard to control what data is returned

---

## ✅ Correct Pattern: UseCase with Input/Output DTOs

### Complete UseCase Implementation

```php
// Input DTO
final readonly class CreateMemberInput
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}

// Output DTO
final readonly class CreateMemberOutput
{
    public function __construct(
        public string $id,
    ) {}
}

// UseCase
final readonly class CreateMemberUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function execute(CreateMemberInput $input): CreateMemberOutput
    {
        $member = Member::create(
            name: Name::create($input->name),
            email: Email::create($input->email),
        );

        $this->repository->save($member);

        return new CreateMemberOutput(
            id: $member->id()->value(),
        );
    }
}

// Controller uses UseCase
final class MemberController extends Controller
{
    public function store(
        CreateMemberRequest $request,
        CreateMemberUseCase $useCase,
    ): RedirectResponse {
        $useCase->execute(new CreateMemberInput(
            name: $request->validated('name'),
            email: $request->validated('email'),
        ));

        return redirect()->route('members.index')
            ->with('success', 'メンバーを作成しました');
    }
}
```

---

## UseCase Patterns

### Simple Create UseCase

```php
final readonly class CreateProjectInput
{
    public function __construct(
        public string $name,
        public string $description,
        public string $managerId,
    ) {}
}

final readonly class CreateProjectOutput
{
    public function __construct(
        public string $id,
    ) {}
}

final readonly class CreateProjectUseCase
{
    public function __construct(
        private ProjectRepositoryInterface $projectRepository,
        private MemberServiceInterface $memberService,
    ) {}

    public function execute(CreateProjectInput $input): CreateProjectOutput
    {
        // Validate manager exists (via Contract)
        if (!$this->memberService->exists($input->managerId)) {
            throw new DomainException('指定された管理者が存在しません');
        }

        $project = Project::create(
            name: ProjectName::create($input->name),
            description: ProjectDescription::create($input->description),
            managerId: MemberId::from($input->managerId),
        );

        $this->projectRepository->save($project);

        return new CreateProjectOutput(
            id: $project->id()->value(),
        );
    }
}
```

### List/Query UseCase with Multiple Results

```php
final readonly class ListMembersOutput
{
    /**
     * @param array<MemberData> $members
     */
    public function __construct(
        public array $members,
    ) {}
}

final readonly class MemberData
{
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
        public string $status,
    ) {}
}

final readonly class ListMembersUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function execute(): ListMembersOutput
    {
        $members = $this->repository->findAll();

        return new ListMembersOutput(
            members: array_map(
                fn(Member $m) => new MemberData(
                    id: $m->id()->value(),
                    name: $m->name()->value(),
                    email: $m->email()->value(),
                    status: $m->status()->value(),
                ),
                $members,
            ),
        );
    }
}
```

### Update UseCase

```php
final readonly class UpdateMemberInput
{
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
    ) {}
}

final readonly class UpdateMemberOutput
{
    public function __construct(
        public string $id,
    ) {}
}

final readonly class UpdateMemberUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function execute(UpdateMemberInput $input): UpdateMemberOutput
    {
        $member = $this->repository->findById(MemberId::from($input->id));

        if ($member === null) {
            throw new DomainException('メンバーが見つかりません');
        }

        // Create new instance with updated values (immutability)
        $updatedMember = Member::reconstruct(
            id: $member->id(),
            name: Name::create($input->name),
            email: Email::create($input->email),
            status: $member->status(),
        );

        $this->repository->save($updatedMember);

        return new UpdateMemberOutput(
            id: $updatedMember->id()->value(),
        );
    }
}
```

### Delete UseCase

```php
final readonly class DeleteMemberInput
{
    public function __construct(
        public string $id,
    ) {}
}

final readonly class DeleteMemberOutput
{
    public function __construct(
        public bool $success,
    ) {}
}

final readonly class DeleteMemberUseCase
{
    public function __construct(
        private MemberRepositoryInterface $repository,
    ) {}

    public function execute(DeleteMemberInput $input): DeleteMemberOutput
    {
        $member = $this->repository->findById(MemberId::from($input->id));

        if ($member === null) {
            throw new DomainException('メンバーが見つかりません');
        }

        $this->repository->delete($member->id());

        return new DeleteMemberOutput(success: true);
    }
}
```

### UseCase with Business Logic

```php
final readonly class StartProjectInput
{
    public function __construct(
        public string $projectId,
    ) {}
}

final readonly class StartProjectOutput
{
    public function __construct(
        public string $id,
        public string $status,
    ) {}
}

final readonly class StartProjectUseCase
{
    public function __construct(
        private ProjectRepositoryInterface $repository,
    ) {}

    public function execute(StartProjectInput $input): StartProjectOutput
    {
        $project = $this->repository->findById(ProjectId::from($input->projectId));

        if ($project === null) {
            throw new DomainException('プロジェクトが見つかりません');
        }

        // Business logic is in Entity
        $startedProject = $project->start();

        $this->repository->save($startedProject);

        return new StartProjectOutput(
            id: $startedProject->id()->value(),
            status: $startedProject->status()->value(),
        );
    }
}
```

### UseCase with Multiple Repositories

```php
final readonly class AssignMemberToProjectInput
{
    public function __construct(
        public string $projectId,
        public string $memberId,
    ) {}
}

final readonly class AssignMemberToProjectOutput
{
    public function __construct(
        public string $projectId,
        public string $memberId,
    ) {}
}

final readonly class AssignMemberToProjectUseCase
{
    public function __construct(
        private ProjectRepositoryInterface $projectRepository,
        private MemberServiceInterface $memberService,
    ) {}

    public function execute(AssignMemberToProjectInput $input): AssignMemberToProjectOutput
    {
        // Validate project exists
        $project = $this->projectRepository->findById(ProjectId::from($input->projectId));
        if ($project === null) {
            throw new DomainException('プロジェクトが見つかりません');
        }

        // Validate member exists (via Contract)
        if (!$this->memberService->exists($input->memberId)) {
            throw new DomainException('メンバーが見つかりません');
        }

        $updatedProject = $project->assignMember(MemberId::from($input->memberId));

        $this->projectRepository->save($updatedProject);

        return new AssignMemberToProjectOutput(
            projectId: $updatedProject->id()->value(),
            memberId: $input->memberId,
        );
    }
}
```

---

## Key Design Principles

### 1. Single Responsibility
- One UseCase per business operation
- Named by action: `Create`, `Update`, `Delete`, `List`, `Start`, etc.
- Clear purpose and boundary

### 2. Input DTO
- Accepts primitive types from Presentation layer
- Validates format (not business rules)
- Named `{Action}{Entity}Input`

### 3. Output DTO
- Returns only necessary data
- Uses primitives or simple structures
- Named `{Action}{Entity}Output`
- Never returns Entity directly

### 4. Dependency Injection
- Constructor injection for dependencies
- Depends on interfaces (not implementations)
- Uses Repository interfaces from Domain layer

### 5. Transaction Boundary
- Each UseCase is one transaction
- Atomic operation
- All-or-nothing execution

### 6. Layer Communication
- Controller → UseCase (via Input DTO)
- UseCase → Repository (via Interface)
- UseCase → Controller (via Output DTO)

---

## Controller Integration

### Inertia Response

```php
final class MemberController extends Controller
{
    public function index(ListMembersUseCase $useCase): Response
    {
        $output = $useCase->execute();

        return Inertia::render('Members/Index', [
            'members' => $output->members,
        ]);
    }

    public function store(
        CreateMemberRequest $request,
        CreateMemberUseCase $useCase,
    ): RedirectResponse {
        $output = $useCase->execute(new CreateMemberInput(
            name: $request->validated('name'),
            email: $request->validated('email'),
        ));

        return redirect()->route('members.show', $output->id)
            ->with('success', 'メンバーを作成しました');
    }
}
```

### API Response

```php
final class MemberApiController extends Controller
{
    public function store(
        CreateMemberRequest $request,
        CreateMemberUseCase $useCase,
    ): JsonResponse {
        $output = $useCase->execute(new CreateMemberInput(
            name: $request->validated('name'),
            email: $request->validated('email'),
        ));

        return response()->json([
            'id' => $output->id,
        ], 201);
    }
}
```

---

## Checklist: UseCase Design

Before considering a UseCase implementation complete, verify:

- [ ] Class is marked as `final readonly`
- [ ] Named `{Action}{Entity}UseCase`
- [ ] Has Input DTO (`{Action}{Entity}Input`)
- [ ] Has Output DTO (`{Action}{Entity}Output`)
- [ ] Uses constructor injection for dependencies
- [ ] Depends on Repository Interface (not implementation)
- [ ] Returns Output DTO (not Entity)
- [ ] No HTTP-specific logic (Request, Response)
- [ ] No direct database access
- [ ] Single responsibility (one business operation)

---

## Why This Matters

**Without DTOs**, code suffers from:
- Tight coupling between layers
- Exposing Domain internals to Presentation
- Hard to change Entity without breaking Controller
- Unclear contracts between layers

**With Input/Output DTOs**, you get:
- Clear layer separation
- Stable contracts
- Testability (no HTTP needed)
- Reusability (CLI, API, Web)
- Type safety
- Documentation through code
