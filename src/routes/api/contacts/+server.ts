// src/routes/api/contacts/+server.ts
import prisma from '$lib/server/prisma';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    const { data: { user } } = await locals.supabase.auth.getUser();
    if (!user) {
        throw error(401, 'Unauthorized');
    }

    try {
        const userProfile = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!userProfile) {
            throw error(404, 'User profile not found');
        }

        let contactsWithConversation = [];

        if (userProfile.role === 'TEACHER') {
            const relations = await prisma.teacherStudent.findMany({
                where: { teacherId: user.id },
                include: { student: true }
            });
            for (const relation of relations) {
                const conversation = await prisma.conversation.findFirst({
                    where: {
                        participants: { every: { id: { in: [user.id, relation.studentId] } } }
                    },
                    select: { id: true }
                });
                contactsWithConversation.push({
                    ...relation.student,
                    conversationId: conversation?.id ?? null
                });
            }
        } else if (userProfile.role === 'STUDENT') {
            const relations = await prisma.teacherStudent.findMany({
                where: { studentId: user.id },
                include: { teacher: true }
            });
            for (const relation of relations) {
                const conversation = await prisma.conversation.findFirst({
                    where: {
                        participants: { every: { id: { in: [user.id, relation.teacherId] } } }
                    },
                    select: { id: true }
                });
                contactsWithConversation.push({
                    ...relation.teacher,
                    conversationId: conversation?.id ?? null
                });
            }
        }

        return json(contactsWithConversation);
    } catch (err) {
        console.error(err);
        throw error(500, 'Could not fetch contacts.');
    }
};
