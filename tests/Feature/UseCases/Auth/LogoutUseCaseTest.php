<?php

declare(strict_types=1);

namespace Tests\Feature\UseCases\Auth;

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
        $this->useCase = new LogoutUseCase;
    }

    /**
     * ログアウトが正しく実行されること
     */
    public function test_logout_successfully(): void
    {
        // Arrange
        $user = User::factory()->create();
        $request = $this->app->make('request');
        $session = $this->app['session']->driver();
        $session->start();
        $request->setLaravelSession($session);
        Auth::login($user);
        $this->assertTrue(Auth::check());

        // Act
        $this->useCase->execute($request);

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
        $request = $this->app->make('request');
        $session = $this->app['session']->driver();
        $session->start();
        $request->setLaravelSession($session);
        $session->put('test_key', 'test_value');
        Auth::login($user);
        $this->assertEquals('test_value', $session->get('test_key'));

        // Act
        $this->useCase->execute($request);

        // Assert
        $this->assertNull($session->get('test_key'));
    }

    /**
     * CSRFトークン再生成が実行されること
     */
    public function test_csrf_token_regenerates_on_logout(): void
    {
        // Arrange
        $user = User::factory()->create();
        $request = $this->app->make('request');
        $session = $this->app['session']->driver();
        $session->start();
        $request->setLaravelSession($session);
        $session->put('_token', 'old_token');
        Auth::login($user);
        $oldToken = $session->get('_token');

        // Act
        $this->useCase->execute($request);

        // Assert
        $newToken = $session->get('_token');
        $this->assertNotEquals($oldToken, $newToken);
    }
}
