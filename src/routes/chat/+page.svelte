<!-- src/routes/chat/+page.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import type { PageData } from './$types';

    // Get data from the server (Step 1)
    export let data: PageData;

    // --- Type Definitions ---
    type Contact = { id: string; email: string | null; conversationId: string | null };
    type Message = {
        id: string;
        content: string;
        senderId: string;
        createdAt: string;
        conversationId: string;
    };

    // --- State Variables ---
    let contacts: Contact[] = [];
    let activeContact: Contact | null = null;
    let activeMessages: Message[] = [];
    let activeConversationId: string | null = null;
    let newMessageContent = '';
    let messageContainer: HTMLDivElement;
    let pollingInterval: any;

    // Reactive User ID from server data (Fixes the styling issue permanently)
    $: currentUserId = data.user?.id;

    onMount(async () => {
        // 1. Fetch Contacts
        const response = await fetch('/api/contacts');
        if (response.ok) {
            contacts = await response.json();
        }

        // 2. Start Polling (The "Low Tech" Realtime)
        startPolling();
    });

    onDestroy(() => {
        stopPolling();
    });

    function startPolling() {
        // Check for new messages every 2 seconds
        pollingInterval = setInterval(async () => {
            if (activeConversationId) {
                await refreshMessages();
            }
        }, 2000);
    }

    function stopPolling() {
        if (pollingInterval) clearInterval(pollingInterval);
    }

    async function refreshMessages() {
        if (!activeConversationId) return;

        // This uses standard HTTP, which we know works perfectly with your cookies
        const response = await fetch(`/api/conversations/${activeConversationId}/messages`);
        if (response.ok) {
            const newMessages = await response.json();

            // Only update if we have new messages to avoid jitter
            if (newMessages.length !== activeMessages.length) {
                activeMessages = newMessages;
                scrollToBottom();
            }
        }
    }

    async function selectContact(contact: Contact) {
        activeContact = contact;
        activeConversationId = contact.conversationId;
        activeMessages = [];

        // Fetch immediately on click
        await refreshMessages();
    }

    async function handleSendMessage() {
        if (!newMessageContent || !activeContact) return;
        const contentToSend = newMessageContent;
        newMessageContent = '';

        // Send the message
        const response = await fetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify({
                content: contentToSend,
                receiverId: activeContact.id
            })
        });

        if (response.ok) {
            // Refresh immediately to show my own message
            await refreshMessages();
        } else {
            console.error('Failed to send message');
        }
    }

    function linkify(text: string) {
        if (!text) return '';
        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[A-Z0-9+&@#\/%=~_|])/gi;
        return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    }

    function scrollToBottom() {
        setTimeout(() => {
            if (messageContainer) messageContainer.scrollTop = messageContainer.scrollHeight;
        }, 50);
    }
</script>

<main>
    <aside class="contact-list">
        <h2>Contacts</h2>
        <ul>
            {#each contacts as contact}
                <li>
                    <button on:click={() => selectContact(contact)} class:active={activeContact?.id === contact.id}>
                        {contact.email}
                    </button>
                </li>
            {/each}
        </ul>
    </aside>

    <section class="chat-window">
        {#if activeContact}
            <div class="chat-header">Chat with {activeContact.email}</div>
            <div class="message-container" bind:this={messageContainer}>
                {#each activeMessages as message}
                    <div
                            class="message"
                            class:sent={message.senderId === currentUserId}
                            class:received={message.senderId !== currentUserId}
                    >
                        <div class="message-content">
                            {@html linkify(message.content)}
                        </div>
                    </div>
                {/each}
            </div>
            <form class="message-form" on:submit|preventDefault={handleSendMessage}>
                <input type="text" bind:value={newMessageContent} placeholder="Type a message..." />
                <button type="submit">Send</button>
            </form>
        {:else}
            <div class="placeholder"><p>Select a contact to start chatting.</p></div>
        {/if}
    </section>
</main>

<style>
    main { display: flex; height: 90vh; font-family: sans-serif; border: 1px solid #ccc; border-radius: 8px; overflow: hidden; }
    .contact-list { width: 280px; border-right: 1px solid #ccc; background: #f9f9f9; display: flex; flex-direction: column; }
    .contact-list h2 { padding: 1rem; margin: 0; border-bottom: 1px solid #ccc; font-size: 1.2rem; }
    .contact-list ul { list-style: none; padding: 0; margin: 0; overflow-y: auto; }
    .contact-list li { padding: 0; }
    .contact-list li button { display: block; width: 100%; text-align: left; padding: 1rem; cursor: pointer; border: none; background: none; border-bottom: 1px solid #eee; font-size: inherit; }
    .contact-list li button:hover { background: #e9e9e9; }
    .contact-list li button.active { background: #007bff; color: white; }
    .chat-window { flex-grow: 1; display: flex; flex-direction: column; }
    .chat-header { padding: 1rem; border-bottom: 1px solid #ccc; background: #f1f1f1; font-weight: bold; }
    .message-container { flex-grow: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; }
    .message { display: flex; }
    .message-content { padding: 0.5rem 1rem; border-radius: 18px; max-width: 70%; word-wrap: break-word; }
    .message.sent { justify-content: flex-end; }
    .message.sent .message-content { background: #007bff; color: white; }
    .message.received { justify-content: flex-start; }
    .message.received .message-content { background: #e9e9e9; color: black; }
    .message-form { display: flex; padding: 1rem; border-top: 1px solid #ccc; }
    .message-form input { flex-grow: 1; padding: 0.75rem; border: 1px solid #ccc; border-radius: 20px; }
    .message-form button { padding: 0.75rem 1.5rem; margin-left: 1rem; border: none; background: #007bff; color: white; border-radius: 20px; cursor: pointer; }
    .placeholder { flex-grow: 1; display: flex; align-items: center; justify-content: center; color: #888; }
</style>