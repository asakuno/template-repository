# Static Analysis with Deptrac

This document explains how to enforce architectural rules using [Deptrac](https://qossmic.github.io/deptrac/), a static analysis tool for PHP dependencies.

## Table of Contents
- [What is Deptrac?](#what-is-deptrac)
- [Module Dependencies Configuration](#module-dependencies-configuration)
- [Layer Dependencies Configuration](#layer-dependencies-configuration)
- [Running Deptrac](#running-deptrac)

---

## What is Deptrac?

Deptrac is a static analysis tool that enforces architectural boundaries in PHP projects. It verifies:
- Modules only depend on allowed modules
- Layers only depend on allowed layers
- Contract pattern is properly enforced

**Benefits**:
- Catches architectural violations at build time
- Prevents accidental coupling
- Documents architectural decisions as code
- Enforces discipline in large teams

---

## Module Dependencies Configuration

This configuration ensures modules only communicate through Contract interfaces.

```yaml
# deptrac/module.yaml
deptrac:
  paths:
    - ./modules
  layers:
    - name: Contract
      collectors:
        - type: directory
          value: modules/Contract/.*
    - name: Member
      collectors:
        - type: directory
          value: modules/Member/.*
    - name: Project
      collectors:
        - type: directory
          value: modules/Project/.*
  ruleset:
    Contract:
      - Contract
    Member:
      - Contract
      - Member
    Project:
      - Contract
      - Project
```

**Explanation**:
- `Contract` layer can only depend on itself
- `Member` module can depend on `Contract` and itself
- `Project` module can depend on `Contract` and itself
- Direct `Member` → `Project` dependency is **prohibited**

**Violation Example**:
```php
// In Project module
use Modules\Member\Domain\Entities\Member;  // ❌ Deptrac error!
```

---

## Layer Dependencies Configuration

This configuration enforces the 4-layer architecture dependency rules.

```yaml
# deptrac/layer.yaml
deptrac:
  paths:
    - ./modules
  layers:
    - name: Presentation
      collectors:
        - type: directory
          value: modules/.*/Presentation/.*
    - name: Application
      collectors:
        - type: directory
          value: modules/.*/Application/.*
    - name: Domain
      collectors:
        - type: directory
          value: modules/.*/Domain/.*
    - name: Infrastructure
      collectors:
        - type: directory
          value: modules/.*/Infrastructure/.*
  ruleset:
    Presentation:
      - Presentation
      - Application
    Application:
      - Application
      - Domain
    Domain:
      - Domain
    Infrastructure:
      - Infrastructure
      - Domain
```

**Explanation**:
- `Presentation` can depend on `Application` (and itself)
- `Application` can depend on `Domain` (and itself)
- `Domain` can only depend on itself (no external dependencies)
- `Infrastructure` can depend on `Domain` (Dependency Inversion)

**Violation Examples**:
```php
// In Domain layer
use Illuminate\Database\Eloquent\Model;  // ❌ Deptrac error!

// In Application layer
use Modules\Member\Infrastructure\Models\MemberModel;  // ❌ Deptrac error!
```

---

## Running Deptrac

### Installation

```bash
composer require --dev qossmic/deptrac
```

### Run Analysis

```bash
# Check module dependencies
./vendor/bin/deptrac analyse --config-file=deptrac/module.yaml

# Check layer dependencies
./vendor/bin/deptrac analyse --config-file=deptrac/layer.yaml

# Run both checks
./vendor/bin/deptrac analyse --config-file=deptrac/module.yaml && \
./vendor/bin/deptrac analyse --config-file=deptrac/layer.yaml
```

### Add to CI Pipeline

```yaml
# .github/workflows/ci.yml
- name: Deptrac Analysis
  run: |
    ./vendor/bin/deptrac analyse --config-file=deptrac/module.yaml
    ./vendor/bin/deptrac analyse --config-file=deptrac/layer.yaml
```

### Generate Dependency Graph (Optional)

```bash
# Generate visual dependency graph
./vendor/bin/deptrac analyse --config-file=deptrac/module.yaml --formatter=graphviz-image --output=module-graph.png
```

---

## Common Deptrac Violations and Fixes

### Violation: Domain depends on Framework

```php
// ❌ Domain layer using Laravel
namespace Modules\Member\Domain\ValueObjects;

use Illuminate\Support\Str;

final readonly class MemberId
{
    public static function generate(): self
    {
        return new self(Str::uuid()->toString());  // Laravel dependency!
    }
}
```

**Fix**: Use pure PHP
```php
// ✅ Pure PHP implementation
namespace Modules\Member\Domain\ValueObjects;

final readonly class MemberId
{
    public static function generate(): self
    {
        // Use Symfony's Uuid (installed separately, not Laravel)
        return new self(\Symfony\Component\Uid\Uuid::v7()->toRfc4122());
    }
}
```

### Violation: Cross-Module Direct Reference

```php
// ❌ Project module directly using Member entity
namespace Modules\Project\Application\UseCases;

use Modules\Member\Domain\Entities\Member;  // Deptrac violation!
```

**Fix**: Use Contract
```php
// ✅ Use Contract interface
namespace Modules\Project\Application\UseCases;

use Modules\Contract\Member\MemberServiceInterface;
use Modules\Contract\Member\DTOs\MemberDto;
```
