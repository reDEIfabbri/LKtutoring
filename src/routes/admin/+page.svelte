<!-- src/routes/admin/+page.svelte -->
<script lang="ts">
    // Variables for the first form
    let teacherId = '';
    let studentId = '';
    let message = ''; // General status message

    // Variables for the second form
    let receiverId = '';
    let messageContent = '';

    // --- NEW: Variables for creating a lesson ---
    let lessonTitle = 'Math Tutoring';
    let lessonStudentId = '';
    let lessonDate = '';
    let lessonDuration = 60;

    async function handleCreateRelationship() {
        message = 'Creating relationship...';
        const response = await fetch('/api/relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacherId, studentId })
        });
        const result = await response.json();
        if (response.ok) {
            message = `Successfully created relationship!`;
        } else {
            message = `Failed: ${result.message}`;
        }
    }

    async function handleSendMessage() {
        message = 'Sending message...';
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiverId, content: messageContent })
        });
        const result = await response.json();
        if (response.ok) {
            message = `Successfully sent message! ID: ${result.id}`;
        } else {
            message = `Failed: ${result.message}`;
        }
    }

    async function handleCreateLesson() {
        message = 'Creating lesson...';

        // Convert the datetime-local string to a proper ISO date string
        const scheduledAt = lessonDate ? new Date(lessonDate).toISOString() : null;

        const response = await fetch('/api/lessons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: lessonTitle,
                studentId: lessonStudentId,
                scheduledAt: scheduledAt,
                duration: lessonDuration
            })
        });

        const result = await response.json();

        if (response.ok) {
            message = `Successfully created lesson! ID: ${result.id}`;
        } else {
            message = `Failed: ${result.message}`;
        }
    }
    </script>

<main style="padding: 2rem; max-width: 600px; margin: auto; font-family: sans-serif;">
    <h1>Admin Panel</h1>

    {#if message}
        <p style="margin-top: 1rem; background: #eee; padding: 0.5rem;">
            <b>Status:</b> {message}
        </p>
    {/if}

    <hr style="margin: 2rem 0;" />

    <h2>Create Relationship</h2>
    <p>
        Go to the Supabase Table Editor for the 'users' table to get the IDs for a teacher and a
        student.
    </p>
    <form
            on:submit|preventDefault={handleCreateRelationship}
            style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;"
    >
        <input type="text" bind:value={teacherId} placeholder="Paste Teacher ID" required />
        <input type="text" bind:value={studentId} placeholder="Paste Student ID" required />
        <button type="submit">Link Teacher and Student</button>
    </form>

    <hr style="margin: 2rem 0;" />

    <h2>Send a Test Message</h2>
    <form
            on:submit|preventDefault={handleSendMessage}
            style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;"
    >
        <input type="text" bind:value={receiverId} placeholder="Paste Receiver ID" required />
        <input type="text" bind:value={messageContent} placeholder="Message content" required />
        <button type="submit">Send Message</button>
    </form>

    <hr style="margin: 2rem 0;" />

    <!-- ... existing forms ... -->

    <hr style="margin: 2rem 0;" />

    <h2>Create Scheduled Lesson</h2>
    <form
            on:submit|preventDefault={handleCreateLesson}
            style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;"
    >
        <input type="text" bind:value={lessonTitle} placeholder="Lesson Title" required />
        <input type="text" bind:value={lessonStudentId} placeholder="Paste Student ID" required />

        <label>
            Date & Time:
            <input type="datetime-local" bind:value={lessonDate} required />
        </label>

        <label>
            Duration (minutes):
            <input type="number" bind:value={lessonDuration} required />
        </label>

        <button type="submit">Create Lesson</button>
    </form>
</main>