---
paths:
  - resources/js/**/*.tsx
  - resources/js/**/*.ts
---

# フロントエンド アーキテクチャ規約

## Inertia.js の基本

Inertia.js はサーバーサイドルーティングを使用するため、React Router や Next.js のようなクライアントサイドルーティングは使用しない。ページコンポーネントは `resources/js/Pages/` に配置し、Laravel のルートと対応させる。

## ディレクトリ構成

```
resources/js/
├── Pages/                    # ページコンポーネント（Inertia）
│   ├── Members/
│   │   ├── Index.tsx
│   │   ├── Show.tsx
│   │   └── Create.tsx
│   └── Dashboard.tsx
├── Components/               # 再利用可能なUIコンポーネント
│   ├── ui/                   # 汎用UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   └── features/             # 機能固有のコンポーネント
│       └── members/
│           ├── MemberCard.tsx
│           └── MemberForm.tsx
├── Layouts/                  # レイアウトコンポーネント
│   ├── AuthenticatedLayout.tsx
│   └── GuestLayout.tsx
├── hooks/                    # カスタムフック
├── types/                    # 型定義
│   ├── index.d.ts
│   └── models.ts
└── lib/                      # ユーティリティ関数
```

## ページコンポーネント

ページコンポーネントは Laravel Controller から渡される props を受け取る。props の型は明示的に定義する。

**エクスポート方針**: Page コンポーネントは `export default` を使用する（Inertia の慣例）。Components 配下は名前付きエクスポートを使用する。

```tsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

interface Member {
    id: string;
    name: string;
    email: string;
}

interface Props {
    members: Member[];
}

// Page コンポーネントは export default を使用
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
    );
}
```

## フォーム送信

**重要**: フォームには Laravel Precognition を使用する。`@inertiajs/react` の `useForm` は**使用禁止**。

Precognition により、フォーム送信前にサーバーサイドのバリデーションルールを使用したリアルタイムバリデーションが可能になる。

```tsx
import { useForm } from 'laravel-precognition-react';
import { router } from '@inertiajs/react';

interface FormData {
    name: string;
    email: string;
}

export default function Create() {
    const form = useForm<FormData>('post', route('members.store'), {
        name: '',
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.submit({
            onSuccess: () => router.visit(route('members.index')),
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                onBlur={() => form.validate('name')}
                error={form.errors.name}
            />
            <Button type="submit" disabled={form.processing}>
                {form.processing ? '処理中...' : '作成'}
            </Button>
        </form>
    );
}
```
