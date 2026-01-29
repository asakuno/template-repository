<?php

declare(strict_types=1);

namespace Tests\Unit\Repositories;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\UserRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * UserRepository ユニットテスト
 */
final class UserRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private UserRepositoryInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new UserRepository;
    }

    /** メールアドレスで既存ユーザーを取得できる */
    public function test_find_by_email_returns_user_when_exists(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $result = $this->repository->findByEmail('test@example.com');

        $this->assertNotNull($result);
        $this->assertEquals($user->id, $result->id);
        $this->assertEquals('test@example.com', $result->email);
    }

    /** 存在しないメールアドレスでnullを返す */
    public function test_find_by_email_returns_null_when_not_exists(): void
    {
        $result = $this->repository->findByEmail('nonexistent@example.com');

        $this->assertNull($result);
    }
}
