import { DatabaseSync } from 'node:sqlite';
import type { TicketData, TicketModelInterface } from '../interfaces/ticket-model.interface.js';
import { number, text } from '../db/row.js';

export class TicketModel implements TicketModelInterface {
    id: number;
    readonly vikunjaTaskId: number;
    readonly title: string;
    readonly status: TicketData['status'];
    readonly priority: number;
    readonly presentOnBoard: boolean;

    constructor(
        private readonly db: DatabaseSync,
        ticket: TicketData
    ) {
        this.id = ticket.id;
        this.vikunjaTaskId = ticket.vikunjaTaskId;
        this.title = ticket.title;
        this.status = ticket.status;
        this.priority = ticket.priority;
        this.presentOnBoard = ticket.presentOnBoard;
    }

    async get(): Promise<TicketData | null> {
        const row = this.db.prepare('SELECT id, vikunja_task_id, title, status, priority, present_on_board FROM tickets WHERE id = ?').get(this.id);
        if (!row) return null;

        const status = text(row, 'status');
        if (status !== 'Ready' && status !== 'In progress' && status !== 'Retry' && status !== 'Done' && status !== 'Flagged tickets') {
            throw new Error('Invalid status in shared database');
        }
        const present = number(row, 'present_on_board');
        if (present !== 0 && present !== 1) throw new Error('Invalid present_on_board in shared database');

        return {
            id: number(row, 'id'),
            vikunjaTaskId: number(row, 'vikunja_task_id'),
            title: text(row, 'title'),
            status,
            priority: number(row, 'priority'),
            presentOnBoard: present === 1,
        };
    }

    async create(): Promise<TicketModel> {
        const result = this.db.prepare(`
            INSERT INTO tickets (vikunja_task_id, title, status, priority, present_on_board)
            VALUES (?, ?, ?, ?, ?)
        `).run(this.vikunjaTaskId, this.title, this.status, this.priority, this.presentOnBoard ? 1 : 0);
        const id = Number(result.lastInsertRowid);
        if (!Number.isSafeInteger(id)) throw new Error('Created ticket ID is not a safe integer');
        this.id = id;
        return this;
    }

    async update(ticket: TicketModelInterface): Promise<void> {
        const result = this.db.prepare(`
            UPDATE tickets SET vikunja_task_id = ?, title = ?, status = ?, priority = ?, present_on_board = ?
            WHERE id = ?
            `).run(ticket.vikunjaTaskId, ticket.title, ticket.status, ticket.priority, ticket.presentOnBoard ? 1 : 0, ticket.id)
        if (result.changes !== 1) throw new Error(`Ticket ${ticket.id} was not found`)
    }

    async delete(): Promise<void> {
        const result = this.db.prepare(`
            DELETE FROM tickets WHERE id = ?
              AND NOT EXISTS (SELECT 1 FROM assignments WHERE ticket_id = ?)
        `).run(this.id, this.id);
        if (result.changes !== 1) throw new Error(`Ticket ${this.id} was not found or has assignments`);
    }
}
