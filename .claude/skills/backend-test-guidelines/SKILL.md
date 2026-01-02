---
name: backend-test-guidelines
description: Comprehensive PHPUnit and Laravel testing guidelines for 4-layer architecture. Covers Unit tests for Domain layer, Feature tests for Application/Infrastructure/Presentation layers, and Inertia testing patterns. Reference this skill when creating or updating backend test code during Phase 2 (Testing & Review).
---

# Backend Test Guidelines - PHPUnit & Laravel Testing

This skill covers testing patterns for Laravel applications following a 4-layer architecture. It focuses on what AI commonly gets wrong in test design and implementation.

---

## How to Use This Skill

### Quick Reference - Phase 2: Testing & Review

**テスト作成時:**
- [ ] Test Strategy Overviewでテストタイプを確認
- [ ] Quick Referenceで該当レイヤーのパターンを確認
- [ ] 詳細が必要な場合は`references/`の該当ファイルを参照

**テスト後チェック:**
- [ ] AI Weakness Checklistで自己チェック
- [ ] テストカバレッジと品質を確認
- [ ] backend-test-reviewエージェントでレビュー

---

## Test Strategy Overview

| Layer | Test Type | Database | Purpose |
|-------|-----------|----------|---------|
| Domain | Unit | No | Entity/ValueObject behavior |
| Application | Unit | No | UseCase logic with mocked Repository |
| Application | Feature | Yes | UseCase integration with real Repository |
| Infrastructure | Feature | Yes | Repository implementation |
| Presentation | Feature | Yes | HTTP request/response, Inertia rendering |

## Directory Structure

```
tests/
├── Unit/
│   └── Modules/
│       └── {Module}/
│           ├── Domain/
│           │   ├── Entities/
│           │   └── ValueObjects/
│           └── Application/
│               └── UseCases/
└── Feature/
    └── Modules/
        └── {Module}/
            ├── Application/
            │   └── UseCases/
            ├── Infrastructure/
            │   └── Repositories/
            └── Presentation/
                └── Controllers/
```

---

## Quick Reference

This table provides a quick overview of test patterns. Click through to detailed documentation for implementation examples.

| Test Type | What to Test | AI Gets Wrong | Correct Pattern | Details |
|-----------|-------------|---------------|-----------------|---------|
| **Domain Unit** | Entity/ValueObject behavior | Uses database, skips validation | Pure logic, no DB, ValueObjects | [→ domain-layer-testing.md](references/domain-layer-testing.md) |
| **UseCase Unit** | UseCase logic | Uses real database | Mock repository, no DB | [→ usecase-testing.md](references/usecase-testing.md) |
| **Repository Feature** | Repository implementation | Tests Eloquent, not Repository | Test through interface, Entity conversion | [→ repository-testing.md](references/repository-testing.md) |
| **Controller Feature** | HTTP/Inertia flow | Only checks status code | Inertia assertions, auth, validation | [→ controller-testing.md](references/controller-testing.md) |
| **Test Structure** | AAA, naming, data providers | Inconsistent structure | Japanese names, AAA pattern, factories | [→ test-structure.md](references/test-structure.md) |

### Quick Decision Guide

**"Should I use RefreshDatabase?"**
- ❌ Domain Unit tests → NO
- ❌ UseCase Unit tests → NO
- ✅ Repository Feature tests → YES
- ✅ Controller Feature tests → YES

**"Should I mock the repository?"**
- ✅ UseCase Unit tests → YES (mock)
- ❌ UseCase Feature tests → NO (real implementation)
- ❌ Repository tests → NO (testing the repository itself)

**"What should I test?"**
- Domain: Factory methods, validation, business rules
- UseCase: Input → Output transformation, error handling
- Repository: CRUD operations, Entity conversion
- Controller: Component, props, redirects, validation, auth

---

## AI Weakness Checklist

Before considering test implementation complete:

### Unit Tests ⚠️
- [ ] No database usage (`RefreshDatabase` not needed)
- [ ] Repository is mocked for UseCase tests
- [ ] Both valid and invalid cases tested for ValueObjects
- [ ] Factory methods tested for Entities

### Feature Tests ⚠️
- [ ] Uses `RefreshDatabase` trait
- [ ] Tests actual database operations
- [ ] Authentication tested (actingAs)
- [ ] Inertia assertions used for controller tests

### Test Structure ⚠️
- [ ] AAA pattern followed
- [ ] Japanese method names
- [ ] Data providers for multiple cases
- [ ] Edge cases covered

### Coverage ⚠️
- [ ] All public methods tested
- [ ] All validation rules tested
- [ ] Error paths tested
- [ ] Authorization tested

---

## Summary

| What to Test | How to Test |
|--------------|-------------|
| ValueObject | Unit test with valid/invalid inputs |
| Entity | Unit test factory methods |
| UseCase | Unit test with mocked repository |
| Repository | Feature test with real database |
| Controller | Feature test with Inertia assertions |
