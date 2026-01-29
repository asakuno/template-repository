<?php

declare(strict_types=1);

namespace Tests\Unit\UseCases\Auth;

use App\Data\Auth\LoginData;
use App\Models\User;
use App\UseCases\Auth\LoginUseCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * ログインユースケース ユニットテスト
 */
final class LoginUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private LoginUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCase = app(LoginUseCase::class);
    }

    /** 正しい認証情報でログイン成功しUserを返却する */
    public function test_execute_returns_user_on_successful_login(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123!'),
        ]);

        $data = LoginData::from([
            'email' => 'test@example.com',
            'password' => 'Password123!',
        ]);

        $result = $this->useCase->execute($data, request());

        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals($user->id, $result->id);
    }

    /** 不正な認証情報でValidationExceptionを送出する */
    public function test_execute_throws_validation_exception_on_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123!'),
        ]);

        $data = LoginData::from([
            'email' => 'test@example.com',
            'password' => 'WrongPassword!',
        ]);

        $this->expectException(ValidationException::class);

        $this->useCase->execute($data, request());
    }

    /** ログイン成功時にセッションが再生成される */
    public function test_execute_regenerates_session_on_success(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123!'),
        ]);

        $data = LoginData::from([
            'email' => 'test@example.com',
            'password' => 'Password123!',
        ]);

        $request = request();
        $oldSessionId = $request->session()->getId();

        $this->useCase->execute($data, $request);

        $this->assertNotEquals($oldSessionId, $request->session()->getId());
    }
}
