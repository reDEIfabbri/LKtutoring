// src/routes/api/relationships/+server.ts
import prisma from '$lib/server/prisma';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This function creates a link between a teacher and a student
export const POST: RequestHandler = async ({ request, locals }) => {
    const { data: { user } } = await locals.supabase.auth.getUser();
    if (!user) {
        throw error(401, 'Unauthorized');
    }

    const { teacherId, studentId } = await request.json();

    if (!teacherId || !studentId) {
        return json({ message: 'teacherId and studentId are required.' }, { status: 400 });
    }

    try {
        // Create the entry in our "join table"
        const newRelationship = await prisma.teacherStudent.create({
            data: {
                teacherId,
                studentId
            }
        });

        return json(newRelationship, { status: 201 });
    } catch (err) {
        console.error(err);
        // This will catch errors, like if the relationship already exists
        return json({ message: 'Could not create relationship.' }, { status: 500 });
    }
};
