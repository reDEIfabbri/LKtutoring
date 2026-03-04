// src/routes/api/lessons/[id]/+server.ts
import prisma from '$lib/server/prisma';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// PATCH: Update an existing lesson
export const PATCH: RequestHandler = async ({ request, params, locals }) => {
    const { id: lessonId } = params;

    // 1. Authenticate
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
        throw error(401, 'Unauthorized');
    }

    // 2. Get data from request
    const { title, content, price, isPaid, scheduledAt, duration } = await request.json();

    try {
        // 3. Verify ownership (Only the teacher can edit)
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId }
        });

        if (!lesson) {
            throw error(404, 'Lesson not found');
        }

        if (lesson.teacherId !== user.id) {
            throw error(403, 'Forbidden: Only the teacher can modify this lesson.');
        }

        // 4. Prepare update data (only update fields that are provided)
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (price !== undefined) updateData.price = price;
        if (isPaid !== undefined) updateData.isPaid = isPaid;
        if (duration !== undefined) updateData.duration = duration;

        // Handle date specifically
        if (scheduledAt !== undefined) {
            updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
        }

        // 5. Perform Update
        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: updateData
        });

        return json(updatedLesson);
    } catch (err) {
        console.error('Error updating lesson:', err);
        if (err instanceof Error && 'status' in err) throw err;
        throw error(500, 'Could not update lesson');
    }
};

// DELETE: Remove a lesson
export const DELETE: RequestHandler = async ({ params, locals }) => {
    const { id: lessonId } = params;

    // 1. Authenticate
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !user) {
        throw error(401, 'Unauthorized');
    }

    try {
        // 2. Verify ownership
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId }
        });

        if (!lesson) {
            throw error(404, 'Lesson not found');
        }

        if (lesson.teacherId !== user.id) {
            throw error(403, 'Forbidden: Only the teacher can delete this lesson.');
        }

        // 3. Perform Delete
        await prisma.lesson.delete({
            where: { id: lessonId }
        });

        return json({ message: 'Lesson deleted successfully' });
    } catch (err) {
        console.error('Error deleting lesson:', err);
        if (err instanceof Error && 'status' in err) throw err;
        throw error(500, 'Could not delete lesson');
    }
};