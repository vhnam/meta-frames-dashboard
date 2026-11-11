export interface User {
  id: string;
  email: string;
  name: string;
  /** The Google profile picture, when the account is linked to Google. */
  avatarUrl?: string;
  createdAt: string;
}
