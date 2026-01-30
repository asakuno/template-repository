<?php

declare(strict_types=1);

namespace App\Http\Resources\Auth;

use App\Data\Auth\AuthenticatedUserData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 認証済みユーザー情報のJSONレスポンスリソース
 *
 * @mixin AuthenticatedUserData
 */
final class AuthenticatedUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}
