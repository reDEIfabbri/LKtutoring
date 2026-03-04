// src/lib/stores.ts
import type { Session } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

export const userSession = writable<Session | null>(null);