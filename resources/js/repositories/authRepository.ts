/**
 * 認証ドメインのサーバー通信を扱うRepository
 */
import { router } from '@inertiajs/react';

export const authRoutes = {
  login: '/login',
  register: '/register',
  logout: '/logout',
  verificationNotification: '/email/verification-notification',
} as const;

type VerificationEmailPost = (
  url: string,
  options: {
    onSuccess: () => void;
    onFinish: () => void;
  },
) => void;

export const authRepository = {
  logout(): Promise<void> {
    return new Promise((resolve) => {
      router.post(
        authRoutes.logout,
        {},
        {
          onError: () => resolve(),
          onFinish: () => resolve(),
        },
      );
    });
  },

  resendVerificationEmail(
    post: VerificationEmailPost,
    onSuccess: () => void,
  ): Promise<void> {
    return new Promise((resolve) => {
      post(authRoutes.verificationNotification, {
        onSuccess,
        onFinish: () => resolve(),
      });
    });
  },
};
