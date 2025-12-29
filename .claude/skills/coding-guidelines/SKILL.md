---
name: coding-guidelines
description: Comprehensive React component coding guidelines for Laravel + Inertia.js applications with Laravel Precognition and hybrid API architecture. **CRITICAL**: Focuses on patterns AI commonly fails to implement correctly, especially testability, props control, and component responsibility separation. Reference this skill when implementing or refactoring React components during Phase 2.
---

# Coding Guidelines - What AI Gets Wrong (Laravel Precognition + Hybrid API Edition)

This skill focuses on patterns AI commonly fails to implement correctly in Laravel + Inertia.js applications using Laravel Precognition for form validation and a hybrid architecture (Inertia for static content, API for dynamic data).

## Architecture Overview

**Hybrid Approach:**
- **Static Content**: Inertia.js (server-rendered, SEO-friendly)
- **Dynamic Data**: API endpoints (real-time updates, interactive features)
- **Form Validation**: Laravel Precognition (real-time validation without full submission)

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

  // Problem: Cannot test each state independently
  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (!user) return <div>Not found</div>

  return <div>{user.name}</div>
}
```

**Correct pattern**: Separate data fetching hook from presentational component

```typescript
// ✅ Testable pattern - Custom hook for data fetching
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [userId])

  return { user, isLoading, error }
}

// Presentational Component - fully testable via props
interface UserProfileProps {
  user: User | null
  isLoading?: boolean
  error?: Error | null
}

function UserProfile({ user, isLoading, error }: UserProfileProps) {
  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (!user) return <div>Not found</div>

  return <div>{user.name}</div>
}

// Page Component - composition
export default function Show({ userId }: { userId: string }) {
  const { user, isLoading, error } = useUser(userId)
  return <UserProfile user={user} isLoading={isLoading} error={error} />
}

// Easy to test presentational component
test('displays user name', () => {
  const user = { name: 'Taro', id: '1' }
  render(<UserProfile user={user} />)
  expect(screen.getByText('Taro')).toBeInTheDocument()
})
```

---

### 2. Form Handling with Laravel Precognition

**Pattern AI gets wrong**: Using Inertia's useForm or manual fetch for forms

```typescript
// ❌ AI writes: Inertia useForm (doesn't use Precognition)
import { useForm } from '@inertiajs/react'

function CreateMember() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
  })
  // Problem: No real-time validation
  // Problem: Validation only on submit
}

// ❌ AI writes: Manual form handling
function CreateMember() {
  const [name, setName] = useState('')
  const [errors, setErrors] = useState({})
  
  const handleSubmit = async () => {
    const res = await fetch('/api/members', { ... })
    // Problem: No precognitive validation
  }
}
```

**Correct pattern**: Use Laravel Precognition with useForm from laravel-precognition-react

```typescript
// ✅ Correct: Laravel Precognition
import { useForm } from 'laravel-precognition-react'

interface CreateMemberFormData {
  name: string
  email: string
  role: string
}

export default function Create() {
  const form = useForm<CreateMemberFormData>('post', route('members.store'), {
    name: '',
    email: '',
    role: 'member',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.submit({
      onSuccess: () => {
        // リダイレクトまたは成功処理
        router.visit(route('members.index'))
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={form.data.name}
        onChange={(e) => form.setData('name', e.target.value)}
        onBlur={() => form.validate('name')} // リアルタイムバリデーション
        error={form.errors.name}
      />
      <Input
        value={form.data.email}
        onChange={(e) => form.setData('email', e.target.value)}
        onBlur={() => form.validate('email')} // リアルタイムバリデーション
        error={form.errors.email}
      />
      <Button type="submit" disabled={form.processing}>
        {form.processing ? '処理中...' : '作成'}
      </Button>
    </form>
  )
}
```

**Laravel Controller with Precognition:**

```php
// app/Http/Controllers/MemberController.php
use Illuminate\Foundation\Http\FormRequest;

final class MemberController extends Controller
{
    public function store(CreateMemberRequest $request, CreateMemberUseCase $useCase): RedirectResponse
    {
        // Precognition はバリデーションのみ実行し、早期リターン
        // 実際のリクエストでは UseCase を実行
        $useCase->execute(new CreateMemberInput(
            name: $request->validated('name'),
            email: $request->validated('email'),
        ));

        return redirect()->route('members.index')
            ->with('success', 'メンバーを作成しました');
    }
}

// app/Http/Requests/CreateMemberRequest.php
final class CreateMemberRequest extends FormRequest
{
    // Precognition を有効化
    protected $precognitiveRules = ['name', 'email', 'role'];

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:members'],
            'role' => ['required', 'in:admin,member,guest'],
        ];
    }
}
```

---

### 3. Hybrid Architecture: Static vs Dynamic Data

**Pattern AI gets wrong**: Mixing static and dynamic data incorrectly

```typescript
// ❌ AI writes: All data from Inertia (no dynamic updates)
export default function Dashboard({ stats, notifications }: Props) {
  // Problem: Data is stale until page reload
  return (
    <div>
      <StatsCard stats={stats} />
      <NotificationList notifications={notifications} />
    </div>
  )
}

// ❌ AI writes: All data from API (unnecessary for static content)
export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [notifications, setNotifications] = useState([])
  
  useEffect(() => {
    fetch('/api/stats').then(...)
    fetch('/api/notifications').then(...)
  }, [])
  // Problem: Static data should come from Inertia
}
```

**Correct pattern**: Hybrid approach - Inertia for static, API for dynamic

```typescript
// ✅ Correct: Hybrid architecture
interface Props {
  // Static data from Inertia (rarely changes)
  user: User
  permissions: Permission[]
  menuItems: MenuItem[]
}

export default function Dashboard({ user, permissions, menuItems }: Props) {
  // Dynamic data from API (frequently changes)
  const { stats, isLoading: statsLoading } = useStats()
  const { notifications, refetch } = useNotifications()

  return (
    <AuthenticatedLayout user={user} menuItems={menuItems}>
      <Head title="ダッシュボード" />
      
      {/* Static content - from Inertia props */}
      <UserHeader user={user} />
      
      {/* Dynamic content - from API */}
      <StatsCard stats={stats} isLoading={statsLoading} />
      <NotificationList 
        notifications={notifications} 
        onMarkAsRead={() => refetch()}
      />
    </AuthenticatedLayout>
  )
}

// Custom hook for dynamic data
function useStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(setStats)
      .finally(() => setIsLoading(false))
  }, [])

  return { stats, isLoading }
}

function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const fetchNotifications = useCallback(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(setNotifications)
  }, [])

  useEffect(() => {
    fetchNotifications()
    // ポーリングまたは WebSocket で定期更新
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return { notifications, refetch: fetchNotifications }
}
```

---

### 4. Data Fetching Patterns

**When to use Inertia props (static data):**
- User profile and authentication state
- Navigation menus and permissions
- Page-specific configuration
- SEO-critical content
- Data that rarely changes

**When to use API (dynamic data):**
- Real-time notifications
- Live statistics and metrics
- Search results with filters
- Paginated lists with sorting
- Data that updates frequently

```typescript
// ✅ API utility with type safety
async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}

// ✅ Custom hook with SWR-like pattern
function useApiData<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await apiGet<T>(url)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [url])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, error, isLoading, refetch }
}
```

---

### 5. Insufficient Props Control

**Pattern AI ALWAYS gets wrong**: Components that cannot be controlled externally

```typescript
// ❌ AI writes: Internal state cannot be tested
function DataTable({ endpoint }: { endpoint: string }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(endpoint).then(...)
  }, [endpoint])

  // Cannot control loading/error states from parent
  return loading ? <Spinner /> : <Table data={data} />
}
```

**Correct pattern**: Presentational component with full props control

```typescript
// ✅ Correct: Separate data fetching from presentation
// Hook for data fetching
function useTableData(endpoint: string) {
  return useApiData<TableRow[]>(endpoint)
}

// Presentational Component - fully controllable
interface DataTableProps {
  data: TableRow[]
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
}

function DataTable({ data, isLoading, error, onRetry }: DataTableProps) {
  if (isLoading) return <TableSkeleton />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (data.length === 0) return <EmptyState />

  return <Table data={data} />
}

// Page Component - composition
export default function MemberList() {
  const { data, isLoading, error, refetch } = useTableData('/api/members')
  
  return (
    <DataTable 
      data={data ?? []} 
      isLoading={isLoading} 
      error={error}
      onRetry={refetch}
    />
  )
}

// Easy to test each state
test('shows loading skeleton', () => {
  render(<DataTable data={[]} isLoading={true} />)
  expect(screen.getByTestId('table-skeleton')).toBeInTheDocument()
})
```

---

### 6. Conditional Branch Extraction

**Pattern AI ALWAYS gets wrong**: Cramming multiple branches into one component

```typescript
// ❌ AI writes: Nested conditional branches
function Dashboard() {
  const { user } = usePage<Props>().props
  const { stats, isLoading } = useStats()

  return (
    <div>
      {user ? (
        isLoading ? (
          <Spinner />
        ) : stats ? (
          <StatsCard stats={stats} />
        ) : (
          <NoData />
        )
      ) : (
        <LoginPrompt />
      )}
    </div>
  )
}
```

**Correct pattern**: Extract each branch into separate component

```typescript
// ✅ Correct: Extracted components
interface Props {
  user: User | null
}

export default function Dashboard({ user }: Props) {
  if (!user) return <LoginPrompt />

  return (
    <AuthenticatedLayout>
      <StatsSection />
    </AuthenticatedLayout>
  )
}

function StatsSection() {
  const { stats, isLoading, error } = useStats()

  return (
    <StatsCard 
      stats={stats} 
      isLoading={isLoading} 
      error={error}
    />
  )
}

// Presentational - testable
interface StatsCardProps {
  stats: Stats | null
  isLoading?: boolean
  error?: Error | null
}

function StatsCard({ stats, isLoading, error }: StatsCardProps) {
  if (isLoading) return <StatsSkeleton />
  if (error) return <StatsError error={error} />
  if (!stats) return <NoStatsData />

  return (
    <Card>
      <CardHeader>統計情報</CardHeader>
      <CardContent>
        <Metric label="総会員数" value={stats.totalMembers} />
        <Metric label="アクティブ" value={stats.activeMembers} />
      </CardContent>
    </Card>
  )
}
```

---

## Refactoring Principles

Eight core principles guide component refactoring:

1. **Logic Extraction** - Separate data fetching into custom hooks
2. **Presenter Pattern** - Consolidate conditional text in presenter.ts
3. **Conditional UI Extraction** - Extract conditional branches to components (CRITICAL)
4. **Naming and Structure** - Use kebab-case directories, PascalCase files
5. **Props Control** - All rendering controllable via props (CRITICAL)
6. **Hybrid Data Strategy** - Inertia for static, API for dynamic
7. **Laravel Precognition** - Real-time validation for all forms
8. **Avoid Over-Abstraction** - Don't create unnecessary wrappers

---

## Component Directory Structure

### Key Rules

**Page Components**:
- Location: `resources/js/Pages/{Module}/{Action}.tsx`
- Receive static data from Inertia props
- Compose presentational components
- Example: `resources/js/Pages/Members/Index.tsx`

**Feature Components**:
- Location: `resources/js/Components/features/{module}/`
- May use custom hooks for dynamic data
- Example: `resources/js/Components/features/members/MemberCard.tsx`

**UI Components**:
- Location: `resources/js/Components/ui/`
- Pure presentational, no data fetching
- Example: `resources/js/Components/ui/Button.tsx`

**Custom Hooks**:
- Location: `resources/js/hooks/`
- Data fetching and business logic
- Example: `resources/js/hooks/useMembers.ts`

---

## Laravel Precognition Patterns

### Form with Real-time Validation

```typescript
import { useForm } from 'laravel-precognition-react'

interface FormData {
  name: string
  email: string
}

export function MemberForm() {
  const form = useForm<FormData>('post', route('members.store'), {
    name: '',
    email: '',
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      form.submit()
    }}>
      <FormField
        label="名前"
        value={form.data.name}
        onChange={(value) => form.setData('name', value)}
        onBlur={() => form.validate('name')}
        error={form.errors.name}
        touched={form.touched('name')}
      />
      <FormField
        label="メール"
        value={form.data.email}
        onChange={(value) => form.setData('email', value)}
        onBlur={() => form.validate('email')}
        error={form.errors.email}
        touched={form.touched('email')}
      />
      <Button 
        type="submit" 
        disabled={form.processing || form.hasErrors}
      >
        {form.processing ? '送信中...' : '送信'}
      </Button>
    </form>
  )
}
```

### Edit Form with Initial Values

```typescript
interface Props {
  member: Member // From Inertia props
}

export default function Edit({ member }: Props) {
  const form = useForm<FormData>('put', route('members.update', member.id), {
    name: member.name,
    email: member.email,
  })

  // ... form implementation
}
```

---

## Navigation Patterns

```typescript
import { router } from '@inertiajs/react'
import { Link } from '@inertiajs/react'

// Declarative navigation (for static links)
<Link href={route('members.show', { id })}>詳細</Link>

// Programmatic navigation (after form submit, etc.)
router.visit(route('members.index'))

// With options
router.visit(route('members.index'), {
  preserveState: true,
  preserveScroll: true,
})
```

---

## Quality Requirements

### Non-Negotiable Standards

- **Preserve external contracts** - Don't change public APIs or behavior
- **Run checks after all work** - `bun run check:fix` and `bun run typecheck`
- **No new `any`** - Solve issues fundamentally, document when unavoidable
- **No new ignores** - No `@ts-ignore` or `// biome-ignore` without reason
- **Resolve warnings** - Fix ESLint/Biome warnings
- **Improve type safety** - Self-explanatory code

---

## AI Weakness Checklist

Before considering implementation complete, verify AI didn't fall into these traps:

### Testability ⚠️ (Most Critical)
- [ ] Data fetching in custom hooks (not in components)
- [ ] Presentational components receive all data via props
- [ ] Each conditional branch extracted to separate component
- [ ] Easy to test each state independently

### Props Control ⚠️
- [ ] Loading states controllable from parent
- [ ] Error states controllable from parent
- [ ] All display variations controllable via props
- [ ] Custom hooks return all necessary states

### Laravel Precognition ⚠️
- [ ] useForm from 'laravel-precognition-react' for all forms
- [ ] onBlur validation for real-time feedback
- [ ] FormRequest with $precognitiveRules
- [ ] Proper error display with touched state

### Hybrid Architecture ⚠️
- [ ] Static data from Inertia props
- [ ] Dynamic data from API via custom hooks
- [ ] Clear separation of concerns
- [ ] Appropriate data source for each use case

### Component Responsibility
- [ ] Custom hooks for data fetching
- [ ] Presentational components for display
- [ ] Page components for composition
- [ ] One responsibility per component

---

## Summary: What to Watch For

AI will confidently write code that:
1. **Uses Inertia's useForm** instead of Laravel Precognition
2. **Fetches all data from API** (should use Inertia for static)
3. **Fetches all data from Inertia** (should use API for dynamic)
4. **Mixes data fetching with presentation** (should separate)
5. **Cannot be tested** (internal state dependencies)

**Trust AI for**:
- Syntax and TypeScript basics
- Import/export statements
- Basic component structure

**Scrutinize AI for**:
- Form handling (must use Laravel Precognition)
- Data source selection (Inertia vs API)
- Testability (custom hooks + presentational components)
- Props control (can parent control all states?)

When in doubt, ask: **"Can I easily test this component's different states without mocking fetch?"**

If the answer is no, extract data fetching to a custom hook and make the component purely presentational.
