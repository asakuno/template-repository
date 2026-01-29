<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * 認証APIコントローラ フィーチャーテスト
 */
final class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    // --- POST /api/login ---

    /** 正しい認証情報で200とユーザー情報を返す */
    public function test_login_with_valid_credentials_returns_user(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123!'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email'],
            ]);
    }

    /** 不正な認証情報で422を返す */
    public function test_login_with_invalid_credentials_returns_422(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123!'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'WrongPassword!',
        ]);

        $response->assertUnprocessable();
    }

    /** バリデーションエラーで422を返す */
    public function test_login_with_validation_error_returns_422(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'not-an-email',
            'password' => '',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    /** レート制限超過で429を返す */
    public function test_login_rate_limited_returns_429(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123!'),
        ]);

        // 6回連続で不正なログインを試行（制限は5回/分）
        for ($i = 0; $i < 6; $i++) {
            $response = $this->postJson('/api/login', [
                'email' => 'test@example.com',
                'password' => 'WrongPassword!',
            ]);
        }

        $response->assertTooManyRequests();
    }

    // --- POST /api/logout ---

    /** 認証済みユーザーがログアウトで200を返す */
    public function test_logout_authenticated_returns_200(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/logout');

        $response->assertOk()
            ->assertJson(['message' => 'ログアウトしました。']);
    }

    /** 未認証でログアウト試行で401を返す */
    public function test_logout_unauthenticated_returns_401(): void
    {
        $response = $this->postJson('/api/logout');

        $response->assertUnauthorized();
    }

    // --- GET /api/user ---

    /** 認証済みユーザー情報を取得する */
    public function test_user_authenticated_returns_user_data(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email'],
            ])
            ->assertJsonPath('data.id', $user->id);
    }

    /** 未認証でユーザー取得は401を返す */
    public function test_user_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertUnauthorized();
    }
}
