// src/routes/api/users/[id]/+server.ts
import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This function handles PATCH requests to update a user
// e.g., PATCH /api/users/some-user-id
// export const PATCH: RequestHandler = async ({ request, params }) => {
//     // The user ID from the URL (e.g., "some-user-id")
//     const studentId = params.id;
//
//     // The ID of the teacher to assign this student to
//     const { teacherId } = await request.json();
//
//     if (!teacherId) {
//         return json({ message: 'teacherId is required.' }, { status: 400 });
//     }
//
//     try {
//         // Update the student's record to link them to the teacher
//         const updatedStudent = await prisma.user.update({
//             where: {
//                 id: studentId
//             },
//             data: {
//                 teacherId: teacherId
//                 // Using Prisma's connect syntax is also possible:
//                 // teacher: { connect: { id: teacherId } }
//             }
//         });
//
//         return json(updatedStudent);
//     } catch (err) {
//         console.error(err);
//         return json({ message: 'Could not assign student.' }, { status: 500 });
//     }
// };
