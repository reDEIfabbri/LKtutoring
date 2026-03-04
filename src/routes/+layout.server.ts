// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    const session = await locals.getSession();

    // We also get the safe user object
    const {
        data: { user }
    } = await locals.supabase.auth.getUser();

    return {
        session,
        user
    };
};