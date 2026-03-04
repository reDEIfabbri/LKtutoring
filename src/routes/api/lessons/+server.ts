// src/routes/api/lessons/+server.ts
import prisma from '$lib/server/prisma';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();

    if (authError || !user) {
        throw error(401, 'Unauthorized');
    }

    // Get the new fields from the request body
    const { title, price, studentId, content, scheduledAt, duration } = await request.json();

    if (!title || !studentId) {
        return json({ message: 'Title and studentId are required.' }, { status: 400 });
    }

    try {
        // 1. Verify Teacher
        const teacherProfile = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!teacherProfile || teacherProfile.role !== 'TEACHER') {
            throw error(403, 'Forbidden: You must be a teacher to create a lesson.');
        }

        // 2. Verify Student (New check to prevent 500 errors)
        const student = await prisma.user.findUnique({
            where: { id: studentId }
        });

        if (!student) {
            return json({ message: `Student with ID ${studentId} not found.` }, { status: 404 });
        }

        // 3. Create Lesson
        const newLesson = await prisma.lesson.create({
            data: {
                title,
                // Safely handle price (default to 0 if missing)
                price: price ? parseFloat(price.toString()) : 0,
                content,
                studentId,
                teacherId: teacherProfile.id,
                // Save the scheduling info if provided
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                // Safely handle duration
                duration: duration ? parseInt(duration.toString()) : 60
            }
        });

        return json(newLesson, { status: 201 });
    } catch (err) {
        // Log the full error to the server console for debugging
        console.error('Error creating lesson:', err);

        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, 'Could not create lesson. Check server logs for details.');
    }
};