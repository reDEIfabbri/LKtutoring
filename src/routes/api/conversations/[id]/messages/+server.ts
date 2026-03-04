// src/routes/api/conversations/[id]/messages/+server.ts
import prisma from '$lib/server/prisma';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This function gets all messages for a specific conversation
export const GET: RequestHandler = async ({ locals, params }) => {
    const { data: { user } } = await locals.supabase.auth.getUser();
    if (!user) {
        throw error(401, 'Unauthorized');
    }

    const conversationId = params.id;

    try {
        // Security Check: First, find the conversation and ensure the current user is a participant.
        const conversation = await prisma.conversation.findUnique({
            where: {
                id: conversationId,
                // This is the important part:
                participants: { some: { id: user.id } }
            }
        });

        // If no conversation is found, it's either because it doesn't exist
        // or the user is not authorized to view it. For security, we return 404.
        if (!conversation) {
            throw error(404, 'Conversation not found');
        }

        // If the user is authorized, fetch all messages for that conversation.
        const messages = await prisma.chatMessage.findMany({
            where: {
                conversationId: conversationId
            },
            orderBy: {
                createdAt: 'asc' // Order messages from oldest to newest
            }
        });

        return json(messages);
    } catch (err) {
        console.error(err);
        // If the error was a thrown SvelteKit error, re-throw it
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, 'Could not fetch messages.');
    }
};