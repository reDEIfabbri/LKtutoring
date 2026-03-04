<!-- src/routes/schedule/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { Calendar } from '@fullcalendar/core';
    import dayGridPlugin from '@fullcalendar/daygrid';
    import timeGridPlugin from '@fullcalendar/timegrid';
    import interactionPlugin from '@fullcalendar/interaction';
    import type { PageData } from './$types';

    export let data: PageData;

    let calendarEl: HTMLElement;
    let calendar: Calendar;

    // --- Modal State ---
    let showModal = false;
    let showUnpaidModal = false;
    let isEditing = false;
    let modalError = '';

    // --- Form Data ---
    let formId = '';
    let formTitle = '';
    let formContactId = '';
    let formDate = '';
    let formTime = '';
    let formDuration = 60;
    let formPrice = 0;
    let formIsPaid = false;

    // --- Reactive Logic for Unpaid Lessons ---
    $: unpaidLessons = data.lessons ? data.lessons.filter((l) => !l.isPaid) : [];

    $: groupedUnpaid = Object.values(
        unpaidLessons.reduce(
            (acc, lesson) => {
                const counterparty = data.user.role === 'TEACHER' ? lesson.student : lesson.teacher;

                if (!acc[counterparty.id]) {
                    acc[counterparty.id] = {
                        user: counterparty,
                        lessons: [],
                        total: 0
                    };
                }

                acc[counterparty.id].lessons.push(lesson);
                acc[counterparty.id].total += lesson.price;
                return acc;
            },
            {} as Record<
                string,
                {
                    user: (typeof data.lessons)[number]['student'];
                    lessons: typeof data.lessons;
                    total: number;
                }
            >
        )
    );

    onMount(() => {
        calendar = new Calendar(calendarEl, {
            plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
            initialView: 'timeGridWeek',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            height: 'auto',
            slotMinTime: '08:00:00',
            slotMaxTime: '22:00:00',
            allDaySlot: false,
            selectable: true,
            editable: true,
            select: handleDateSelect,
            eventClick: handleEventClick,
            eventDrop: handleEventDrop,
            eventResize: handleEventDrop
        });

        calendar.render();
        calendar.addEventSource(data.events);
    });

    function handleDateSelect(info: any) {
        resetForm();
        isEditing = false;
        const date = new Date(info.startStr);
        formDate = date.toISOString().split('T')[0];
        formTime = date.toTimeString().slice(0, 5);
        showModal = true;
    }

    function handleEventClick(info: any) {
        const event = info.event;
        const props = event.extendedProps;

        isEditing = true;
        formId = event.id;
        formTitle = event.title;
        formContactId = data.user.role === 'TEACHER' ? props.studentId : props.teacherId;

        const start = event.start;
        formDate = start.toISOString().split('T')[0];
        formTime = start.toTimeString().slice(0, 5);

        const durationMs = event.end.getTime() - event.start.getTime();
        formDuration = Math.round(durationMs / 60000);

        formPrice = props.price;
        formIsPaid = props.isPaid;

        showModal = true;
    }

    async function handleEventDrop(info: any) {
        const event = info.event;
        const durationMs = event.end.getTime() - event.start.getTime();
        const durationMins = Math.round(durationMs / 60000);

        await fetch(`/api/lessons/${event.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                scheduledAt: event.start.toISOString(),
                duration: durationMins
            })
        });
    }

    async function handleSubmit() {
        modalError = '';
        const scheduledAt = new Date(`${formDate}T${formTime}:00`).toISOString();

        const payload = {
            title: formTitle,
            studentId: data.user.role === 'TEACHER' ? formContactId : data.user.id,
            teacherId: data.user.role === 'TEACHER' ? data.user.id : formContactId,
            scheduledAt,
            duration: formDuration,
            price: formPrice,
            isPaid: formIsPaid
        };

        let response;
        if (isEditing) {
            response = await fetch(`/api/lessons/${formId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
        } else {
            response = await fetch('/api/lessons', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        if (response.ok) {
            location.reload();
        } else {
            const res = await response.json();
            modalError = res.message || 'Failed to save lesson';
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this lesson?')) return;
        const response = await fetch(`/api/lessons/${formId}`, { method: 'DELETE' });
        if (response.ok) location.reload();
        else alert('Failed to delete lesson');
    }

    function resetForm() {
        formId = '';
        formTitle = '';
        formContactId = '';
        formDate = '';
        formTime = '';
        formDuration = 60;
        formPrice = 0;
        formIsPaid = false;
        modalError = '';
    }
</script>

<main>
    <div class="header-actions">
        <h1>Schedule</h1>
        <button class="unpaid-btn" on:click={() => (showUnpaidModal = true)}>
            Unpaid Lessons ({unpaidLessons.length})
        </button>
    </div>

    <div class="calendar-container" bind:this={calendarEl}></div>

    <!-- Create/Edit Modal -->
    {#if showModal}
        <div
                class="modal-backdrop"
                on:click|self={() => (showModal = false)}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Escape' && (showModal = false)}
        >
            <div class="modal">
                <h2>{isEditing ? 'Edit Lesson' : 'New Lesson'}</h2>
                {#if modalError}<p class="error">{modalError}</p>{/if}
                <form on:submit|preventDefault={handleSubmit}>
                    <label>Title <input type="text" bind:value={formTitle} required /></label>
                    {#if data.user.role === 'TEACHER'}
                        <label
                        >Student
                            <select bind:value={formContactId} required>
                                <option value="" disabled>Select a student</option>
                                {#each data.contacts as contact}
                                    <option value={contact.id}>{contact.email}</option>
                                {/each}
                            </select>
                        </label>
                    {/if}
                    <div class="row">
                        <label>Date <input type="date" bind:value={formDate} required /></label>
                        <label>Time <input type="time" bind:value={formTime} required /></label>
                    </div>
                    <label
                    >Duration (min) <input
                            type="number"
                            bind:value={formDuration}
                            required
                            min="15"
                            step="15"
                    /></label
                    >
                    {#if data.user.role === 'TEACHER'}
                        <div class="row">
                            <label
                            >Price <input type="number" bind:value={formPrice} min="0" step="0.01" /></label
                            >
                            <label class="checkbox-label"
                            ><input type="checkbox" bind:checked={formIsPaid} /> Paid</label
                            >
                        </div>
                    {/if}
                    <div class="actions">
                        {#if isEditing}<button type="button" class="delete-btn" on:click={handleDelete}
                        >Delete</button
                        >{/if}
                        <button type="submit" class="save-btn">Save</button>
                    </div>
                </form>
            </div>
        </div>
    {/if}

    <!-- Unpaid Lessons Modal -->
    {#if showUnpaidModal}
        <div
                class="modal-backdrop"
                on:click|self={() => (showUnpaidModal = false)}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Escape' && (showUnpaidModal = false)}
        >
            <div class="modal unpaid-modal">
                <h2>Unpaid Lessons Overview</h2>

                {#if groupedUnpaid.length === 0}
                    <p style="text-align: center; color: #666;">No unpaid lessons found. Good job!</p>
                {:else}
                    <div class="unpaid-list">
                        {#each groupedUnpaid as group}
                            <div class="group-card">
                                <div class="group-header">
                                    <h3>{group.user.email}</h3>
                                    <span class="total-due">Total Due: ${group.total.toFixed(2)}</span>
                                </div>
                                <ul>
                                    {#each group.lessons as lesson}
                                        <li>
											<span class="lesson-date">
												{lesson.scheduledAt
                                                    ? new Date(lesson.scheduledAt).toLocaleDateString()
                                                    : 'Unscheduled'}
											</span>
                                            <span class="lesson-title">{lesson.title}</span>
                                            <span class="lesson-price">${lesson.price.toFixed(2)}</span>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        {/each}
                    </div>
                {/if}

                <div class="actions">
                    <button on:click={() => (showUnpaidModal = false)}>Close</button>
                </div>
            </div>
        </div>
    {/if}
</main>

<style>
    main {
        padding: 2rem;
        font-family: sans-serif;
    }
    .calendar-container {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    /* Header Actions */
    .header-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    .unpaid-btn {
        background-color: #ffc107;
        color: #212529;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }

    /* Modal Styles */
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    .modal {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        width: 400px;
        max-width: 90%;
    }

    /* Unpaid Modal Specifics */
    .unpaid-modal {
        width: 600px;
    }
    .unpaid-list {
        max-height: 60vh;
        overflow-y: auto;
        margin: 1rem 0;
    }
    .group-card {
        border: 1px solid #eee;
        border-radius: 4px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    .group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eee;
        padding-bottom: 0.5rem;
        margin-bottom: 0.5rem;
    }
    .group-header h3 {
        margin: 0;
        font-size: 1.1rem;
    }
    .total-due {
        font-weight: bold;
        color: #dc3545;
    }
    .group-card ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .group-card li {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
        font-size: 0.9rem;
    }
    .lesson-date {
        color: #666;
        width: 100px;
    }
    .lesson-title {
        flex: 1;
    }
    .lesson-price {
        font-weight: bold;
    }

    /* Form Styles */
    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    label {
        display: flex;
        flex-direction: column;
        font-size: 0.9rem;
        font-weight: bold;
    }
    input,
    select {
        padding: 0.5rem;
        margin-top: 0.25rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    .row {
        display: flex;
        gap: 1rem;
    }
    .row label {
        flex: 1;
    }
    .checkbox-label {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
    }
    .checkbox-label input {
        margin: 0;
    }
    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1rem;
    }
    button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }
    .save-btn {
        background: #007bff;
        color: white;
    }
    .delete-btn {
        background: #dc3545;
        color: white;
    }
    .error {
        color: red;
        background: #ffe6e6;
        padding: 0.5rem;
        border-radius: 4px;
    }
</style>