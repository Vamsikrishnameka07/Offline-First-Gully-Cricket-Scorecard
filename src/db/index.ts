import Dexie, { type Table } from 'dexie';
import type { Match } from '../types';

export class CricketDB extends Dexie {
    matches!: Table<Match>;

    constructor() {
        super('CricketScorecardDB');
        this.version(1).stores({
            matches: 'id, status, createdAt' // Primary key and indices
        });
    }
}

export const db = new CricketDB();

export const saveMatch = async (match: Match) => {
    await db.matches.put(match);
};

export const getMatch = async (id: string) => {
    return await db.matches.get(id);
};

export const getAllMatches = async () => {
    return await db.matches.orderBy('createdAt').reverse().toArray();
};
