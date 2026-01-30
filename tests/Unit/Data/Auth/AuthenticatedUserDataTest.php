<?php

declare(strict_types=1);

namespace Tests\Unit\Data\Auth;

use App\Data\Auth\AuthenticatedUserData;
use App\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

final class AuthenticatedUserDataTest extends TestCase
{
    #[Test]
    public function it_creates_dto_correctly(): void
    {
        // Arrange & Act
        $data = AuthenticatedUserData::from([
            'id' => 1,
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Assert
        $this->assertSame(1, $data->id);
        $this->assertSame('Test User', $data->name);
        $this->assertSame('test@example.com', $data->email);
    }

    #[Test]
    public function it_creates_dto_from_model(): void
    {
        // Arrange
        $user = new User();
        $user->id = 1;
        $user->name = 'Test User';
        $user->email = 'test@example.com';

        // Act
        $data = AuthenticatedUserData::fromModel($user);

        // Assert
        $this->assertSame(1, $data->id);
        $this->assertSame('Test User', $data->name);
        $this->assertSame('test@example.com', $data->email);
    }
}
