<?php

declare(strict_types=1);

namespace Tests\Unit\UseCases\Auth;

use App\Models\User;
use App\UseCases\Auth\LogoutUseCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

final class LogoutUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private LogoutUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCase = new LogoutUseCase();
    }

    /**
     * ログアウトが正しく実行されること
     */
    public function test_logout_successfully(): void
    {
        // Arrange
        $user = User::factory()->create();
        Auth::login($user);
        $this->assertTrue(Auth::check());

        // Act
        $this->useCase->execute();

        // Assert
        $this->assertFalse(Auth::check());
    }

    /**
     * セッション無効化が実行されること
     */
    public function test_session_invalidates_on_logout(): void
    {
        // Arrange
        $user = User::factory()->create();
        Auth::login($user);
        session()->start();
        session()->put('test_key', 'test_value');
        $this->assertEquals('test_value', session()->get('test_key'));

        // Act
        $this->useCase->execute();

        // Assert
        $this->assertNull(session()->get('test_key'));
    }

    /**
     * CSRFトークン再生成が実行されること
     */
    public function test_csrf_token_regenerates_on_logout(): void
    {
        // Arrange
        $user = User::factory()->create();
        Auth::login($user);
        session()->start();
        $oldToken = csrf_token();

        // Act
        $this->useCase->execute();

        // Assert
        $newToken = csrf_token();
        $this->assertNotEquals($oldToken, $newToken);
    }
}
