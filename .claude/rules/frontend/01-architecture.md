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

Inertia のフォームヘルパーを使用する。`useForm` フックでフォーム状態を管理し、`router` でナビゲーションを行う。

```tsx
import { useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('members.store'));
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                error={errors.name}
            />
            <Button type="submit" disabled={processing}>
                作成
            </Button>
        </form>
    );
}
```
