// src/routes/+page.server.ts
import prisma from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const { data: { user } } = await locals.supabase.auth.getUser();

    if (!user) {
        return { user: null };
    }

    // Fetch the next upcoming lesson
    const nextLesson = await prisma.lesson.findFirst({
        where: {
            OR: [{ teacherId: user.id }, { studentId: user.id }],
            scheduledAt: {
                gte: new Date() // Greater than or equal to now
            }
        },
        orderBy: {
            scheduledAt: 'asc'
        },
        include: {
            teacher: true,
            student: true
        }
    });

    // Fetch count of unpaid lessons (where I am the student, or I am the teacher)
    // If I am a teacher, I want to know who owes me.
    // If I am a student, I want to know what I owe.
    const unpaidCount = await prisma.lesson.count({
        where: {
            OR: [{ teacherId: user.id }, { studentId: user.id }],
            isPaid: false
        }
    });

    return {
        user,
        nextLesson,
        unpaidCount
    };
};