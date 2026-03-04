// src/routes/api/users/+server.ts
import prisma from '$lib/server/prisma';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This function handles POST requests
// export const POST: RequestHandler = async ({ request }) => {
//     // Get the email and role from the request body
//     const { email, role } = await request.json();
//
//     // Basic validation
//     if (!email) {
//         return json({ message: 'Email is required.' }, { status: 400 });
//     }
//
//     try {
//         // Use the Prisma Client to create a new user in the database
//         const newUser = await prisma.user.create({
//             data: {
//                 email: email,
//                 role: role // e.g., "TEACHER" or "STUDENT"
//             }
//         });
//
//         // Send the newly created user back as a response
//         return json(newUser, { status: 201 });
//     } catch (err) {
//         // This will catch errors, like if the email already exists
//         console.error(err);
//         return json({ message: 'Could not create user.' }, { status: 500 });
//     }
// };
