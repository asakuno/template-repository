---
name: coding-guidelines
description: Comprehensive React component coding guidelines for Laravel + Inertia.js applications. **CRITICAL**: Focuses on patterns AI commonly fails to implement correctly, especially testability, props control, and component responsibility separation. Reference this skill when implementing or refactoring React components during Phase 2.
---

# Coding Guidelines - What AI Gets Wrong (Inertia.js Edition)

This skill focuses on patterns AI commonly fails to implement correctly in Laravel + Inertia.js applications. Trust AI for syntax and structure, but scrutinize these critical areas where AI consistently makes mistakes.

## ⚠️ Critical: AI's Common Failures

### 1. Lack of Testability (Most Critical)

**Pattern AI ALWAYS gets wrong**: Creating components that control UI branches with internal state

```typescript
// ❌ Typical AI pattern (untestable)
function UserProfile({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [userId])

  // Problem 1: To test loading state, you must actually trigger fetch
  // Problem 2: To test error state, you must make fetch fail
  // Problem 3: Cannot test each state independently

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (!user) return <div>Not found</div>

  return <div>{user.name}</div>
}
```

**Why is this untestable?**:
- Depends on **internal state** (`loading`, `error`, `user`)
- To test each state, you must **actually trigger** those states
- Mocks and stubs become complex, tests become brittle

**Correct pattern for Inertia.js**: Data comes from Laravel Controller as props

```typescript
// ✅ Testable pattern - Data from Laravel Controller
// Laravel Controller:
// return Inertia::render('Users/Show', ['user' => $user]);

interface Props {
  user: User | null
}

export default function Show({ user }: Props) {
  if (!user) return <div>Not found</div>
  return <UserProfile user={user} />
}

// Presentational Component - fully testable
interface UserProfileProps {
  user: User
}

function UserProfile({ user }: UserProfileProps) {
  return <div>{user.name}</div>
}

// Easy to test
test('displays Not found when user is null', () => {
  render(<Show user={null} />)
  expect(screen.getByText('Not found')).toBeInTheDocument()
})

test('displays user name', () => {
  const user = { name: 'Taro', id: '1' }
  render(<UserProfile user={user} />)
  expect(screen.getByText('Taro')).toBeInTheDocument()
})
```

---

### 2. Insufficient Props Control

**Pattern AI ALWAYS gets wrong**: Components hold internal state that cannot be controlled externally

```typescript
// ❌ AI writes: trapped in internal state with useEffect
function UserCard({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])

  // Problem: Cannot control loading/error states from parent
  // Problem: Actual fetch runs during tests

  return user ? <div>{user.name}</div> : <div>Loading...</div>
}
```

**Correct pattern for Inertia.js**: Receive data via props from Controller

```typescript
// ✅ Correct: Data passed from Laravel Controller
// Laravel Controller handles data fetching

// Page Component receives all data as props
interface Props {
  user: User | null
  isLoading?: boolean // Can be controlled for skeleton states
}

export default function Show({ user, isLoading }: Props) {
  return <UserCard user={user} isLoading={isLoading} />
}

// Presentational Component - fully controlled via props
interface UserCardProps {
  user: User | null
  isLoading?: boolean
  error?: string | null
}

function UserCard({ user, isLoading, error }: UserCardProps) {
  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage message={error} />
  if (!user) return <div>Not found</div>

  return <div>{user.name}</div>
}

// Easy to test
test('loading state', () => {
  render(<UserCard user={null} isLoading={true} />)
  expect(screen.getByTestId('spinner')).toBeInTheDocument()
})
```

---

### 3. Insufficient Conditional Branch Extraction

**Pattern AI ALWAYS gets wrong**: Cramming multiple conditional branches into one component

```typescript
// ❌ AI writes: scattered conditional branches
function Dashboard() {
  const { user, subscription, notifications } = usePage<Props>().props

  return (
    <div>
      {/* Problem 1: user conditional branch */}
      {user ? (
        <div>
          <h1>{user.name}</h1>
          {/* Problem 2: subscription conditional branch */}
          {subscription?.isPremium ? (
            <PremiumBadge />
          ) : (
            <FreeBadge />
          )}
        </div>
      ) : (
        <LoginPrompt />
      )}

      {/* Problem 3: notifications conditional branch */}
      {notifications.length > 0 ? (
        <NotificationList items={notifications} />
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
```

**Correct pattern**: Separate components for each conditional branch

```typescript
// ✅ Correct: extract conditional branches into separate components

// Page Component
interface Props {
  user: User | null
  subscription: Subscription | null
  notifications: Notification[]
}

export default function Dashboard({ user, subscription, notifications }: Props) {
  return (
    <AuthenticatedLayout>
      <UserSection user={user} subscription={subscription} />
      <NotificationSection notifications={notifications} />
    </AuthenticatedLayout>
  )
}

// Extracted Components
interface UserSectionProps {
  user: User | null
  subscription: Subscription | null
}

function UserSection({ user, subscription }: UserSectionProps) {
  if (!user) return <LoginPrompt />

  return (
    <div>
      <h1>{user.name}</h1>
      <SubscriptionBadge subscription={subscription} />
    </div>
  )
}

interface SubscriptionBadgeProps {
  subscription: Subscription | null
}

function SubscriptionBadge({ subscription }: SubscriptionBadgeProps) {
  if (subscription?.isPremium) return <PremiumBadge />
  return <FreeBadge />
}

// Easy to test each branch
test('displays premium badge', () => {
  const subscription = { isPremium: true }
  render(<SubscriptionBadge subscription={subscription} />)
  expect(screen.getByTestId('premium-badge')).toBeInTheDocument()
})
```

---

### 4. Mixing Data Fetching with UI Display (Inertia.js Context)

**Pattern AI ALWAYS gets wrong in Inertia**: Using useEffect for data fetching

```typescript
// ❌ AI writes: data fetching with useEffect (WRONG for Inertia)
'use client' // This directive doesn't exist in Inertia

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data)
        setLoading(false)
      })
  }, [userId])

  // Problem: In Inertia, data should come from Laravel Controller
  // Problem: This creates unnecessary client-side fetching
  // Problem: Hard to test

  if (loading) return <Spinner />
  return <div>{user?.name}</div>
}
```

**Correct pattern for Inertia.js**: Laravel Controller handles data, component receives props

```typescript
// ✅ Correct: Laravel Controller fetches data
// app/Http/Controllers/UserController.php
// public function show(string $id) {
//     $user = $this->userRepository->findById($id);
//     return Inertia::render('Users/Show', [
//         'user' => $user ? new UserResource($user) : null,
//     ]);
// }

// Page Component - receives data as props
interface Props {
  user: User | null
}

export default function Show({ user }: Props) {
  return (
    <AuthenticatedLayout>
      <Head title="ユーザー詳細" />
      {user ? <UserProfile user={user} /> : <NotFound />}
    </AuthenticatedLayout>
  )
}

// Presentational Component
interface UserProfileProps {
  user: User
}

function UserProfile({ user }: UserProfileProps) {
  return <div>{user.name}</div>
}

// Easy to test (data fetching and display separated)
test('displays user name', () => {
  const user = { name: 'Taro', id: '1' }
  render(<UserProfile user={user} />)
  expect(screen.getByText('Taro')).toBeInTheDocument()
})
```

---

### 5. Form Handling with useForm (Inertia Specific)

**Pattern AI gets wrong**: Not using Inertia's useForm properly

```typescript
// ❌ AI writes: Manual form handling
function CreateMember() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    try {
      await fetch('/api/members', {
        method: 'POST',
        body: JSON.stringify({ name, email }),
      })
    } catch (err) {
      setErrors(err.errors)
    } finally {
      setProcessing(false)
    }
  }

  // Problem: Not using Inertia's built-in form handling
  // Problem: Manual state management
  // Problem: No automatic validation error handling
}
```

**Correct pattern**: Use Inertia's useForm hook

```typescript
// ✅ Correct: Inertia useForm
import { useForm } from '@inertiajs/react'

interface Props {
  errors?: Record<string, string>
}

export default function Create({ errors: serverErrors }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('members.store'), {
      onSuccess: () => reset(),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={data.name}
        onChange={(e) => setData('name', e.target.value)}
        error={errors.name}
      />
      <Input
        value={data.email}
        onChange={(e) => setData('email', e.target.value)}
        error={errors.email}
      />
      <Button type="submit" disabled={processing}>
        {processing ? <Spinner /> : '作成'}
      </Button>
    </form>
  )
}
```

---

## Refactoring Principles

Eight core principles guide component refactoring:

1. **Logic Extraction** - Separate non-UI logic into utility files
2. **Presenter Pattern** - Consolidate conditional text in presenter.ts
3. **Conditional UI Extraction** - Extract conditional branches to components (CRITICAL)
4. **Naming and Structure** - Use kebab-case directories, PascalCase files
5. **Props Control** - All rendering controllable via props (CRITICAL)
6. **Use Inertia Patterns** - useForm for forms, router for navigation
7. **Avoid Over-Abstraction** - Don't create unnecessary wrappers
8. **Data from Controller** - Never fetch data in useEffect, receive via props

**CRITICAL** marked principles are areas where AI ALWAYS makes mistakes.

---

## Component Directory Structure

### Key Rules

**Page Components**:
- Location: `resources/js/Pages/{Module}/{Action}.tsx`
- Naming: PascalCase matching route action
- Example: `resources/js/Pages/Members/Index.tsx`

**Feature Components**:
- Location: `resources/js/Components/features/{module}/`
- Example: `resources/js/Components/features/members/MemberCard.tsx`

**UI Components**:
- Location: `resources/js/Components/ui/`
- Example: `resources/js/Components/ui/Button.tsx`

**Export Strategy**:
- Page components use default export (required by Inertia)
- UI components use named exports
- No barrel imports

---

## Inertia.js Specific Patterns

### Page Component Pattern

```typescript
// resources/js/Pages/Members/Index.tsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'
import { MemberCard } from '@/Components/features/members/MemberCard'

interface Member {
  id: string
  name: string
  email: string
}

interface Props {
  members: Member[]
}

export default function Index({ members }: Props) {
  return (
    <AuthenticatedLayout>
      <Head title="メンバー一覧" />
      <div className="container mx-auto">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </AuthenticatedLayout>
  )
}
```

### Form Pattern with useForm

```typescript
import { useForm } from '@inertiajs/react'

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('members.store'))
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={data.name}
        onChange={(e) => setData('name', e.target.value)}
        error={errors.name}
      />
      <Button type="submit" disabled={processing}>
        {processing ? 'Processing...' : 'Submit'}
      </Button>
    </form>
  )
}
```

### Navigation Pattern

```typescript
import { router } from '@inertiajs/react'

// Programmatic navigation
router.visit(route('members.show', { id: member.id }))

// With Link component
import { Link } from '@inertiajs/react'
<Link href={route('members.show', { id: member.id })}>
  View Details
</Link>
```

### Loading States

```typescript
// Option 1: useForm's processing state
const { processing } = useForm({...})
<Button disabled={processing}>
  {processing ? <Spinner /> : 'Submit'}
</Button>

// Option 2: router progress
import { router } from '@inertiajs/react'
import { useState, useEffect } from 'react'

function useRouterProgress() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    router.on('start', () => setLoading(true))
    router.on('finish', () => setLoading(false))
  }, [])

  return loading
}
```

---

## Quality Requirements

### Non-Negotiable Standards

- **Preserve external contracts** - Don't change public APIs or behavior
- **Run checks after all work** - `bun run check:fix` and `bun run typecheck`
- **No new `any`** - Solve issues fundamentally, document when unavoidable
- **No new ignores** - No `@ts-ignore` or `// biome-ignore` without reason
- **Resolve warnings** - Fix ESLint/Biome warnings, remove unnecessary ignores
- **Improve type safety** - Produce self-explanatory code (comments only for exceptional cases)

---

## AI Weakness Checklist

Before considering implementation complete, verify AI didn't fall into these traps:

### Testability ⚠️ (Most Critical)
- [ ] All UI states controlled via props (not internal state)
- [ ] Each conditional branch extracted to separate component
- [ ] No internal state that can't be controlled from parent
- [ ] Functions take arguments (not relying on closures/globals)
- [ ] Easy to test each state independently

### Props Control ⚠️
- [ ] Data comes from Laravel Controller as props
- [ ] Loading states controllable from parent
- [ ] Error states controllable from parent
- [ ] All display variations controllable via props
- [ ] No useEffect for data fetching

### Inertia.js Patterns ⚠️
- [ ] useForm for all forms
- [ ] router/Link for navigation
- [ ] Page components receive props from Controller
- [ ] processing state for loading indicators
- [ ] errors from useForm for validation display

### Component Responsibility
- [ ] Data fetching in Laravel Controller (not React components)
- [ ] Display logic in presenter.ts (not embedded in JSX)
- [ ] Validation logic in Laravel Request/UseCase (not in components)
- [ ] One responsibility per component

### Over-Abstraction
- [ ] No wrapper components without added value
- [ ] No single-use abstractions
- [ ] Direct rendering when no logic needed

### Type Safety
- [ ] No `any` types
- [ ] Explicit type annotations on all props
- [ ] Type guards for runtime checks
- [ ] Props interface matches Laravel Output DTO

---

## Summary: What to Watch For

AI will confidently write code that:
1. **Looks clean** but is **impossible to test** (internal state dependencies)
2. **Works** but **can't be controlled** from parent (no props control)
3. **Uses useEffect** for data fetching (should use Controller props)
4. **Manual form handling** instead of Inertia's useForm
5. **Is abstract** but **has no benefit** (unnecessary wrappers)

**Trust AI for**:
- Syntax and TypeScript basics
- Import/export statements
- Basic component structure

**Scrutinize AI for**:
- Testability (internal state vs props)
- Component responsibility (one thing per component)
- Props control (can parent control all states?)
- Inertia patterns (useForm, router, Controller props)
- Conditional branch extraction (separate components?)

When in doubt, ask: **"Can I easily test this component's different states?"**

If the answer is no, refactor until you can pass props to control each state independently.
