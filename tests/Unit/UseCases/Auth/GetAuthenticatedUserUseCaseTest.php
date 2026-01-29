<?php

declare(strict_types=1);

namespace Tests\Unit\UseCases\Auth;

use App\Models\User;
use App\UseCases\Auth\GetAuthenticatedUserUseCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * 認証済みユーザー取得ユースケース ユニットテスト
 */
final class GetAuthenticatedUserUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private GetAuthenticatedUserUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCase = new GetAuthenticatedUserUseCase;
    }

    /** 認証済みユーザーを返却する */
    public function test_execute_returns_authenticated_user(): void
    {
        $user = User::factory()->create();

        // 認証済みユーザーをセットしたリクエストを作成
        $request = Request::create('/api/user', 'GET');
        $request->setUserResolver(fn () => $user);

        $result = $this->useCase->execute($request);

        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals($user->id, $result->id);
    }
}
