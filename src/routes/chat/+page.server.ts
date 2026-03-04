// src/routes/chat/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    // Use getUser() for server-side security.
    const {
        data: { user },
        error
    } = await locals.supabase.auth.getUser();

    // We also need the session for the client-side to work correctly
    const {
        data: { session }
    } = await locals.supabase.auth.getSession();

    return {
        user,
        session // <-- FIX: Return the session to satisfy the PageData type
    };
};