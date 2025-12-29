---
name: backend-architecture-guidelines
description: 4-layer architecture design guidelines for Laravel applications. Covers layer responsibilities, dependency rules, module isolation, and DDD-lite patterns. Reference this skill when planning backend architecture decisions during Phase 1 (Planning & Review).
---

# Backend Architecture Guidelines - 4-Layer DDD-Lite

This skill provides architectural guidelines for Laravel applications following a 4-layer architecture with Domain-Driven Design principles.

## Table of Contents
- [How to Use This Skill](#how-to-use-this-skill)
- [Architecture Overview](#architecture-overview)
- [Dependency Rules](#dependency-rules)
- [Layer Responsibilities](#layer-responsibilities)
- [Module Structure and Isolation](#module-structure-and-isolation)
- [Static Analysis with Deptrac](#static-analysis-with-deptrac)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Decision Framework](#decision-framework)
- [Architecture Decision Checklist](#architecture-decision-checklist)
- [Reference Documentation](#reference-documentation)

---

## How to Use This Skill

### During Phase 1: Architecture Planning & Review

This skill is designed to be referenced during Phase 1 (Planning & Review) when making backend architecture decisions.

**Step 1: Understand the Requirements**
- [ ] Review feature requirements from `DESIGN.md` or specification
- [ ] Identify the business domain(s) involved
- [ ] List the data entities and operations required

**Step 2: Determine Module Placement**
- [ ] Does this belong to an existing module? (Check `modules/` directory)
- [ ] If new module needed, verify against [Decision Framework](#decision-framework)
- [ ] If cross-module communication needed, plan Contract interfaces

**Step 3: Design Layer Structure**
- [ ] Identify what goes in each layer using [Layer Responsibilities](#layer-responsibilities)
- [ ] Verify dependency rules: [Dependency Rules](#dependency-rules)
- [ ] Review detailed layer patterns: [Layer Details](references/layer-details.md)

**Step 4: Plan Module Communication (if cross-module)**
- [ ] Design Contract interface in `modules/Contract/{Module}/`
- [ ] Define Contract DTOs for data exchange
- [ ] Review: [Module Structure](references/module-structure.md)

**Step 5: Validate Design**
- [ ] Run through [Architecture Decision Checklist](#architecture-decision-checklist)
- [ ] Check for anti-patterns: [Anti-Patterns](references/anti-patterns.md)
- [ ] Plan Deptrac validation: [Deptrac Configuration](references/deptrac-config.md)

**Step 6: Document Decisions**
- [ ] Document module boundaries and responsibilities
- [ ] Document Contract interfaces (if new)
- [ ] Note any architectural trade-offs made

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  (Controller, Request, Resource, Middleware, Inertia)       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│            (UseCase, DTO, ApplicationService)               │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  (Entity, ValueObject, DomainService, Repository Interface) │
└─────────────────────────────▲───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                   Infrastructure Layer                       │
│      (Repository Implementation, Eloquent Model, Query)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependency Rules

### Fundamental Rule
**Dependencies point inward - outer layers depend on inner layers.**

```
Presentation → Application → Domain ← Infrastructure
```

- **Domain Layer**: ZERO external dependencies (pure PHP only)
- **Infrastructure Layer**: Implements Domain interfaces (Dependency Inversion)
- **Application Layer**: Orchestrates Domain objects through interfaces
- **Presentation Layer**: Handles HTTP concerns, uses Application layer

### What Each Layer Can Depend On

| Layer | Can Depend On |
|-------|---------------|
| Presentation | Application, (Domain DTOs for display) |
| Application | Domain |
| Domain | Nothing (Pure PHP) |
| Infrastructure | Domain (for implementing interfaces) |

---

## Layer Responsibilities

### Quick Reference

**Presentation Layer**: HTTP request/response handling
- Controllers, Requests, Resources, Middleware
- **Detailed guide**: [Layer Details - Presentation](references/layer-details.md#presentation-layer)

**Application Layer**: Use case orchestration
- UseCases, DTOs, Application Services
- **Detailed guide**: [Layer Details - Application](references/layer-details.md#application-layer)

**Domain Layer**: Business logic and rules
- Entities, ValueObjects, Repository Interfaces, Domain Services
- **Detailed guide**: [Layer Details - Domain](references/layer-details.md#domain-layer)

**Infrastructure Layer**: Technical implementation details
- Repository Implementations, Eloquent Models, QueryBuilders
- **Detailed guide**: [Layer Details - Infrastructure](references/layer-details.md#infrastructure-layer)

📖 **See [Layer Details](references/layer-details.md) for comprehensive examples and patterns.**

---

## Module Structure and Isolation

### Rule: Modules communicate ONLY through Contract

Modules must not directly reference another module's internal implementation. All cross-module communication goes through `modules/Contract/{Module}/` interfaces.

```php
// ❌ WRONG: Direct cross-module reference
use Modules\Member\Domain\Entities\Member;

// ✅ CORRECT: Use Contract interface
use Modules\Contract\Member\MemberServiceInterface;
```

📖 **See [Module Structure](references/module-structure.md) for:**
- Complete directory layout
- Contract pattern implementation
- Module isolation rules and examples

---

## Static Analysis with Deptrac

Deptrac enforces architectural boundaries at build time. Two configuration files verify:
- **Module dependencies**: Modules only communicate through Contract
- **Layer dependencies**: Dependency rules are respected

```bash
# Verify module boundaries
./vendor/bin/deptrac analyse --config-file=deptrac/module.yaml

# Verify layer boundaries
./vendor/bin/deptrac analyse --config-file=deptrac/layer.yaml
```

📖 **See [Deptrac Configuration](references/deptrac-config.md) for:**
- Complete configuration files
- Common violations and fixes
- CI pipeline integration

---

## Anti-Patterns to Avoid

Common architectural mistakes and their solutions:

1. **Anemic Domain Model**: Entities with no behavior → Put business logic in Entities
2. **God UseCase**: UseCase doing too much → Split into focused UseCases
3. **Leaky Abstractions**: Framework types in interfaces → Use Domain types

📖 **See [Anti-Patterns](references/anti-patterns.md) for detailed examples and correct implementations.**

---

## Decision Framework

### When to Create a New Module

Create a new module when:
- Feature has its own business domain
- Feature can be developed independently
- Feature has clear boundaries
- Feature might be extracted as microservice later

### When to Create a Domain Service

Use Domain Service when:
- Logic involves multiple entities
- Logic doesn't naturally belong to one entity
- Operation requires coordination between aggregates

```php
// ✅ Domain Service for cross-entity logic
final readonly class MemberTransferService
{
    public function transfer(
        Member $member,
        Project $fromProject,
        Project $toProject,
    ): void {
        $fromProject->removeMember($member->id());
        $toProject->addMember($member->id());
    }
}
```

### When to Create a ValueObject

Create ValueObject when:
- Value has validation rules
- Value has behavior (formatting, comparison)
- Value is used in multiple places
- Primitive obsession is emerging

---

## Architecture Decision Checklist

When making architecture decisions, verify:

### Layer Placement
- [ ] Is this code in the correct layer?
- [ ] Does it depend only on allowed layers?
- [ ] Is business logic in Domain layer?

### Module Boundaries
- [ ] Does this belong to an existing module?
- [ ] If cross-module, using Contract?
- [ ] Are module boundaries respected?

### Dependencies
- [ ] Domain layer has no framework imports?
- [ ] Repository interface in Domain, implementation in Infrastructure?
- [ ] Controller depends on UseCase, not Repository?

### Entity Design
- [ ] Using factory methods (create/reconstruct)?
- [ ] Properties are readonly?
- [ ] Business logic in Entity, not Service?

### UseCase Design
- [ ] Using Input/Output DTOs?
- [ ] Single responsibility?
- [ ] Depending on interfaces?

---

## Reference Documentation

For detailed implementation guides and examples:

- **[Layer Details](references/layer-details.md)** - Detailed explanations and code examples for each layer
- **[Module Structure](references/module-structure.md)** - Module organization and Contract pattern
- **[Deptrac Configuration](references/deptrac-config.md)** - Static analysis setup and common violations
- **[Anti-Patterns](references/anti-patterns.md)** - Common mistakes and correct implementations
