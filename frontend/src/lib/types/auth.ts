export type AuthFeatures = {
  registration_enabled: boolean;
  allowed_domain?: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};
