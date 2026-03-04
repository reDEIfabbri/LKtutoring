// src/routes/api/messages/+server.ts
import prisma from '$lib/server/prisma';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
    const { data: { user: sender } } = await locals.supabase.auth.getUser();
    if (!sender) {
        throw error(401, 'Unauthorized');
    }

    const { content, receiverId } = await request.json();

    if (!content || !receiverId) {
        return json({ message: 'Content and receiverId are required.' }, { status: 400 });
    }

    if (sender.id === receiverId) {
        return json({ message: 'You cannot send a message to yourself.' }, { status: 400 });
    }

    try {
        // This is a complex transaction: find or create a conversation, then create the message.
        const message = await prisma.$transaction(async (tx) => {
            // Step 1: Find a conversation that involves ONLY these two users.
            let conversation = await tx.conversation.findFirst({
                where: {
                    AND: [
                        { participants: { some: { id: sender.id } } },
                        { participants: { some: { id: receiverId } } },
                        { participants: { every: { id: { in: [sender.id, receiverId] } } } }
                    ]
                }
            });

            // Step 2: If no conversation exists, create one.
            if (!conversation) {
                conversation = await tx.conversation.create({
                    data: {
                        participants: {
                            connect: [{ id: sender.id }, { id: receiverId }]
                        }
                    }
                });
            }

            // Step 3: Create the actual chat message.
            const newChatMessage = await tx.chatMessage.create({
                data: {
                    content,
                    senderId: sender.id,
                    conversationId: conversation.id
                }
            });

            return newChatMessage;
        });

        return json(message, { status: 201 });
    } catch (err) {
        console.error(err);
        return json({ message: 'Could not send message.' }, { status: 500 });
    }
};