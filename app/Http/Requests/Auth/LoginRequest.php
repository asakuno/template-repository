<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Data\Auth\LoginData;
use Illuminate\Foundation\Http\FormRequest;

/**
 * ログインリクエスト バリデーション
 */
final class LoginRequest extends FormRequest
{
    /**
     * リクエストの認可判定
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * バリデーションルール
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    /**
     * バリデーション済みデータをLoginDataに変換する
     */
    public function toData(): LoginData
    {
        return LoginData::from($this->validated());
    }
}
