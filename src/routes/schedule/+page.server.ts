// src/routes/schedule/+page.server.ts
import prisma from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    // 1. Get the session
    const session = await locals.getSession();

    // 2. Get the user
    const {
        data: { user }
    } = await locals.supabase.auth.getUser();

    if (!user) {
        throw redirect(303, '/');
    }

    // 3. Fetch the user's profile
    const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            teaching: { include: { student: true } },
            learning: { include: { teacher: true } }
        }
    });

    if (!currentUser) {
        throw redirect(303, '/');
    }

    // 4. Get contacts
    let contacts: typeof currentUser.teaching[number]['student'][] = [];

    if (currentUser.role === 'TEACHER') {
        contacts = currentUser.teaching.map((r) => r.student);
    } else {
        contacts = currentUser.learning.map((r) => r.teacher);
    }

    // 5. Fetch all lessons
    const lessons = await prisma.lesson.findMany({
        where: {
            OR: [{ teacherId: user.id }, { studentId: user.id }]
        },
        include: {
            teacher: true,
            student: true
        },
        orderBy: {
            scheduledAt: 'desc' // Show newest first
        }
    });

    // 6. Transform for Calendar
    const events = lessons
        .filter((l) => l.scheduledAt)
        .map((l) => {
            const start = new Date(l.scheduledAt!);
            const end = new Date(start.getTime() + l.duration * 60000);
            return {
                id: l.id,
                title: l.title,
                start: start.toISOString(),
                end: end.toISOString(),
                extendedProps: {
                    description: l.content,
                    price: l.price,
                    studentId: l.studentId,
                    teacherId: l.teacherId,
                    isPaid: l.isPaid
                },
                backgroundColor: l.isPaid ? '#28a745' : '#3788d8'
            };
        });

    return {
        session,
        user: currentUser,
        contacts,
        events,
        lessons // <--- Added this so we can list them in the modal
    };
};