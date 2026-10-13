import { createAuthClient } from "better-auth/react";

// No baseURL: same-origin requests resolve relative to window.location in the browser.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, updateUser, useSession } = authClient;
