import { create } from 'zustand';
import type { Match, Ball } from '../types';
import { saveMatch, getMatch } from '../db';
import { addBallToMatch, createNewMatch, calculateInningStats } from '../utils/scoringLogic';

interface MatchState {
    currentMatch: Match | null;
    isLoading: boolean;
    loadMatch: (id: string) => Promise<void>;
    startNewMatch: (data: { teamA: string; teamB: string; overs: number; ballsPerOver: number }) => Promise<string>;
    addBall: (ball: Ball) => Promise<void>;
    undoLastBall: () => Promise<void>;
    lockCurrentOver: () => Promise<void>;
    startNextOver: () => Promise<void>;
}

export const useMatchStore = create<MatchState>((set, get) => ({
    currentMatch: null,
    isLoading: false,

    loadMatch: async (id: string) => {
        set({ isLoading: true });
        const match = await getMatch(id);
        set({ currentMatch: match || null, isLoading: false });
    },

    startNewMatch: async ({ teamA, teamB, overs, ballsPerOver }) => {
        const match = createNewMatch(teamA, teamB, overs, ballsPerOver);
        await saveMatch(match);
        set({ currentMatch: match });
        return match.id;
    },

    addBall: async (ball: Ball) => {
        const { currentMatch } = get();
        if (!currentMatch) return;

        const newMatch = addBallToMatch(currentMatch, ball);
        await saveMatch(newMatch);
        set({ currentMatch: newMatch });
    },

    undoLastBall: async () => {
        const { currentMatch } = get();
        if (!currentMatch) return;

        // Deep clone
        const newMatch = JSON.parse(JSON.stringify(currentMatch)) as Match;
        const inning = newMatch.innings[newMatch.currentInningIndex];
        const currentOver = inning.overs[inning.overs.length - 1];

        if (currentOver && currentOver.balls.length > 0) {
            if (currentOver.isLocked) {
                return;
            }
            currentOver.balls.pop();
            // Recalc
            newMatch.innings[newMatch.currentInningIndex] = calculateInningStats(inning);
            await saveMatch(newMatch);
            set({ currentMatch: newMatch });
        }
    },

    lockCurrentOver: async () => {
        const { currentMatch } = get();
        if (!currentMatch) return;

        const newMatch = JSON.parse(JSON.stringify(currentMatch)) as Match;
        const inning = newMatch.innings[newMatch.currentInningIndex];
        const currentOver = inning.overs[inning.overs.length - 1];

        if (currentOver) {
            currentOver.isLocked = true;
            await saveMatch(newMatch);
            set({ currentMatch: newMatch });
        }
    },

    startNextOver: async () => {
        const { currentMatch } = get();
        if (!currentMatch) return;

        const newMatch = JSON.parse(JSON.stringify(currentMatch)) as Match;
        const inning = newMatch.innings[newMatch.currentInningIndex];

        // Check if max overs reached?
        if (inning.overs.length >= newMatch.rules.overs) {
            // Inning 1 Ends -> Start Inning 2
            if (newMatch.currentInningIndex === 0) {
                newMatch.currentInningIndex = 1;
                const secondInning = newMatch.innings[1];
                if (secondInning.overs.length === 0) {
                    secondInning.overs.push({
                        number: 1,
                        balls: [],
                        isLocked: false,
                        totalRuns: 0,
                        wickets: 0
                    });
                }
                await saveMatch(newMatch);
                set({ currentMatch: newMatch });
                return;
            }
            // Inning 2 Ends -> Match Complete
            else {
                newMatch.status = "COMPLETED";
                const runsA = newMatch.innings[0].totalRuns;
                const runsB = newMatch.innings[1].totalRuns;
                if (runsA > runsB) {
                    newMatch.winner = newMatch.teamA;
                    newMatch.winMargin = `${runsA - runsB} Runs`;
                } else if (runsB > runsA) {
                    newMatch.winner = newMatch.teamB;
                    // Simple margin for MVP
                    newMatch.winMargin = `${10 - newMatch.innings[1].totalWickets} Wickets`;
                } else {
                    newMatch.winner = "Draw";
                    newMatch.winMargin = "Tie";
                }

                await saveMatch(newMatch);
                set({ currentMatch: newMatch });
                return;
            }
        }

        // Create new over
        inning.overs.push({
            number: inning.overs.length + 1,
            balls: [],
            isLocked: false,
            totalRuns: 0,
            wickets: 0
        });

        await saveMatch(newMatch);
        set({ currentMatch: newMatch });
    }

}));
