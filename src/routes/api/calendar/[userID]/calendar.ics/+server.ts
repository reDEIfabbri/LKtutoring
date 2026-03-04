// src/routes/api/calendar/[userID]/calendar.ics/+server.ts
import prisma from '$lib/server/prisma';
import { error } from '@sveltejs/kit';
// FIX: Import the generic RequestHandler from the main kit package
// instead of the generated ./$types file.
import type { RequestHandler } from '@sveltejs/kit';
import ical from 'ical-generator';

export const GET: RequestHandler = async ({ params }) => {
    // params is now typed as a generic dictionary, so we can access userID
    const userId = params.userID;

    if (!userId) {
        throw error(400, 'User ID is required');
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw error(404, 'User not found');
        }

        const lessons = await prisma.lesson.findMany({
            where: {
                AND: [
                    { scheduledAt: { not: null } },
                    {
                        OR: [
                            { teacherId: userId },
                            { studentId: userId }
                        ]
                    }
                ]
            },
            include: {
                teacher: true,
                student: true
            }
        });

        const calendar = ical({
            name: 'LK Tutoring Schedule',
            timezone: 'UTC',
            ttl: 60 * 60
        });

        lessons.forEach((lesson) => {
            if (!lesson.scheduledAt) return;

            const startTime = new Date(lesson.scheduledAt);
            const endTime = new Date(startTime.getTime() + lesson.duration * 60000);

            calendar.createEvent({
                start: startTime,
                end: endTime,
                summary: lesson.title,
                description: lesson.content || 'Tutoring Lesson',
                location: 'Online',
                organizer: {
                    name: lesson.teacher.email || 'Teacher',
                    email: lesson.teacher.email || 'noreply@lktutoring.com'
                },
                id: lesson.id
            });
        });

        return new Response(calendar.toString(), {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': 'inline; filename="calendar.ics"',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

    } catch (err) {
        console.error(err);
        throw error(500, 'Could not generate calendar');
    }
};