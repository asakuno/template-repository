<?php

declare(strict_types=1);

namespace Tests\Unit\UseCases\Auth;

use App\Models\User;
use App\UseCases\Auth\LogoutUseCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ログアウトユースケース ユニットテスト
 */
final class LogoutUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private LogoutUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCase = app(LogoutUseCase::class);
    }

    /** ログアウト後にセッションが無効化される */
    public function test_execute_invalidates_session(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $request = $this->app->make('request');
        $request->setLaravelSession($this->app->make('session.store'));
        $oldSessionId = $request->session()->getId();

        $this->useCase->execute($request);

        $this->assertNotEquals($oldSessionId, $request->session()->getId());
        $this->assertGuest();
    }

    /** ログアウト後にCSRFトークンが再生成される */
    public function test_execute_regenerates_csrf_token(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $request = $this->app->make('request');
        $request->setLaravelSession($this->app->make('session.store'));
        $oldToken = $request->session()->token();

        $this->useCase->execute($request);

        $this->assertNotEquals($oldToken, $request->session()->token());
    }
}
