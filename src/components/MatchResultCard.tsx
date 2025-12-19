import { forwardRef } from 'react';
import type { Match } from '../types';
import { ShieldCheck, Trophy } from 'lucide-react';

interface MatchResultCardProps {
    match: Match;
}

const MatchResultCard = forwardRef<HTMLDivElement, MatchResultCardProps>(({ match }, ref) => {
    const inning1 = match.innings[0];
    const inning2 = match.innings[1];

    return (
        <div ref={ref} className="bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 rounded-2xl w-[320px] text-center border border-neutral-700 shadow-2xl">
            <div className="flex justify-center mb-4">
                <Trophy className="text-yellow-500 w-12 h-12" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-1 uppercase tracking-wider">{match.teamA} vs {match.teamB}</h2>
            <div className="text-xs text-neutral-400 mb-6 flex items-center justify-center gap-1">
                <ShieldCheck size={12} className="text-green-500" />
                Verified Match Result
            </div>

            <div className="space-y-4 mb-6">
                <div className="bg-neutral-800/50 p-3 rounded-xl flex justify-between items-center">
                    <span className="font-semibold text-neutral-300">{match.teamA}</span>
                    <span className="font-bold text-xl text-white">{inning1.totalRuns}/{inning1.totalWickets}</span>
                </div>
                <div className="bg-neutral-800/50 p-3 rounded-xl flex justify-between items-center">
                    <span className="font-semibold text-neutral-300">{match.teamB}</span>
                    <span className="font-bold text-xl text-white">{inning2.totalRuns}/{inning2.totalWickets}</span>
                </div>
            </div>

            <div className="bg-green-600/20 text-green-400 p-3 rounded-xl font-bold border border-green-500/20">
                {match.winner ? `${match.winner} Won by ${match.winMargin}` : "Match Draw"}
            </div>

            <div className="mt-4 text-[10px] text-neutral-600 font-mono">
                Scored via Gully Cricket App
            </div>
        </div>
    );
});

export default MatchResultCard;
