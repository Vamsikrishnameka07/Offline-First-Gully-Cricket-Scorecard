import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import { Trophy, Home, Shield } from 'lucide-react';
import type { Inning } from '../types';

export default function Summary() {
    const { matchId } = useParams();
    const { loadMatch, currentMatch, isLoading } = useMatchStore();
    const [activeTab, setActiveTab] = useState<0 | 1>(0);

    useEffect(() => {
        if (matchId) loadMatch(matchId);
    }, [matchId, loadMatch]);

    if (isLoading || !currentMatch) return <div className="h-screen flex items-center justify-center bg-black text-white">Loading Summary...</div>;

    const activeInning = currentMatch.innings[activeTab];

    const calculateSR = (runs: number, balls: number) => {
        if (balls === 0) return 0;
        return ((runs / balls) * 100).toFixed(1);
    };

    const calculateEcon = (runs: number, balls: number) => {
        if (balls === 0) return 0;
        const overs = balls / 6;
        return (runs / overs).toFixed(1);
    };

    return (
        <div className="min-h-screen bg-black text-white pb-20 font-sans">
            {/* Header / Result */}
            <div className="p-6 flex flex-col items-center border-b border-neutral-900 bg-neutral-900/20">
                <Trophy size={48} className="text-yellow-500 mb-4" />
                <h2 className="text-3xl font-black text-center bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
                    {currentMatch.winner} Won
                </h2>
                <p className="text-neutral-500 font-mono text-sm">by {currentMatch.winMargin}</p>

                <div className="grid grid-cols-2 gap-12 mt-6 w-full max-w-sm">
                    <div className="text-center">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">{currentMatch.teamA}</div>
                        <div className="text-xl font-bold">{currentMatch.innings[0].totalRuns}/{currentMatch.innings[0].totalWickets}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">{currentMatch.teamB}</div>
                        <div className="text-xl font-bold">{currentMatch.innings[1].totalRuns}/{currentMatch.innings[1].totalWickets}</div>
                    </div>
                </div>
            </div>

            {/* Scorecard Tabs */}
            <div className="sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-neutral-800 flex">
                <button
                    onClick={() => setActiveTab(0)}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 0 ? 'border-green-500 text-green-400' : 'border-transparent text-neutral-500'
                        }`}
                >
                    {currentMatch.teamA}
                </button>
                <button
                    onClick={() => setActiveTab(1)}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 1 ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-500'
                        }`}
                >
                    {currentMatch.teamB}
                </button>
            </div>

            {/* Content */}
            <div className="p-4 max-w-2xl mx-auto space-y-8">
                {/* Batting */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest px-2">
                        <Shield size={12} /> Batting
                    </div>
                    <div className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-800/50 text-[10px] font-bold text-neutral-500 uppercase">
                                <tr>
                                    <th className="p-3">Batter</th>
                                    <th className="p-3 text-right">R</th>
                                    <th className="p-3 text-right text-neutral-600">B</th>
                                    <th className="p-3 text-right hidden sm:table-cell">4s</th>
                                    <th className="p-3 text-right hidden sm:table-cell">6s</th>
                                    <th className="p-3 text-right text-neutral-600">SR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {activeInning.players.filter(p => p.batting.balls > 0 || p.batting.isOut || indexIsStrikerOrNonStriker(p.id, activeInning)).map((player) => (
                                    <tr key={player.id} className="hover:bg-white/5 active:bg-white/5 transition-colors">
                                        <td className="p-3">
                                            <div className="font-semibold text-neutral-200">{player.name}</div>
                                            <div className="text-[10px] text-neutral-500">
                                                {player.batting.isOut ? 'out' : 'not out'}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-white">{player.batting.runs}</td>
                                        <td className="p-3 text-right font-mono text-neutral-500">{player.batting.balls}</td>
                                        <td className="p-3 text-right font-mono hidden sm:table-cell text-neutral-600">{player.batting.fours}</td>
                                        <td className="p-3 text-right font-mono hidden sm:table-cell text-neutral-600">{player.batting.sixes}</td>
                                        <td className="p-3 text-right font-mono text-neutral-600">{calculateSR(player.batting.runs, player.batting.balls)}</td>
                                    </tr>
                                ))}
                                {/* Extras Row */}
                                <tr className="bg-neutral-800/20">
                                    <td className="p-3 font-bold text-neutral-400 text-xs uppercase">Extras</td>
                                    <td colSpan={5} className="p-3 text-right font-mono text-neutral-300">
                                        {(activeInning.totalRuns - activeInning.players.reduce((sum, p) => sum + p.batting.runs, 0))}
                                    </td>
                                </tr>
                                {/* Total Row */}
                                <tr className="bg-neutral-800/40 font-bold border-t-2 border-neutral-700">
                                    <td className="p-3 text-white">Total</td>
                                    <td colSpan={5} className="p-3 text-right text-lg text-white">
                                        {activeInning.totalRuns} <span className="text-sm font-normal text-neutral-400">/ {activeInning.totalWickets}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bowling */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest px-2">
                        <Shield size={12} className="rotate-180" /> Bowling
                    </div>
                    <div className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-800/50 text-[10px] font-bold text-neutral-500 uppercase">
                                <tr>
                                    <th className="p-3">Bowler</th>
                                    <th className="p-3 text-right">O</th>
                                    <th className="p-3 text-right text-neutral-600 hidden sm:table-cell">M</th>
                                    <th className="p-3 text-right">R</th>
                                    <th className="p-3 text-right">W</th>
                                    <th className="p-3 text-right text-neutral-600">Econ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {currentMatch.innings[activeTab === 0 ? 1 : 0].players.filter(p => p.bowling.balls > 0).map((player) => (
                                    <tr key={player.id} className="hover:bg-white/5 active:bg-white/5 transition-colors">
                                        <td className="p-3 font-semibold text-neutral-200">{player.name}</td>
                                        <td className="p-3 text-right font-mono text-neutral-300">
                                            {Math.floor(player.bowling.balls / 6)}.{player.bowling.balls % 6}
                                        </td>
                                        <td className="p-3 text-right font-mono text-neutral-600 hidden sm:table-cell">{player.bowling.maidens}</td>
                                        <td className="p-3 text-right font-mono text-neutral-300">{player.bowling.runsConceded}</td>
                                        <td className="p-3 text-right font-mono font-bold text-green-400">{player.bowling.wickets}</td>
                                        <td className="p-3 text-right font-mono text-neutral-600">{calculateEcon(player.bowling.runsConceded, player.bowling.balls)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Return Home */}
                <div className="pt-8">
                    <Link to="/" className="w-full bg-neutral-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-700 transition-colors">
                        <Home size={20} /> Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

function indexIsStrikerOrNonStriker(playerId: string, inning: Inning) {
    return playerId === inning.strikerId || playerId === inning.nonStrikerId;
}
