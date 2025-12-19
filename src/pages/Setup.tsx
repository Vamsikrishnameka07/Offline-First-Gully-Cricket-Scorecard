import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import { Users, Timer } from 'lucide-react';

export default function Setup() {
    const navigate = useNavigate();
    const startNewMatch = useMatchStore(state => state.startNewMatch);

    const [teamA, setTeamA] = useState('');
    const [teamB, setTeamB] = useState('');
    const [overs, setOvers] = useState(5);
    const [ballsPerOver, setBallsPerOver] = useState(6);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Advanced: Player Names
    const [showPlayerInputs, setShowPlayerInputs] = useState(false);
    const [playersA, setPlayersA] = useState<string[]>(Array(11).fill(''));
    const [playersB, setPlayersB] = useState<string[]>(Array(11).fill(''));

    const handleStart = async (e: FormEvent) => {
        e.preventDefault();
        if (!teamA.trim() || !teamB.trim()) return;

        setIsSubmitting(true);
        const matchId = await startNewMatch({
            teamA,
            teamB,
            overs,
            ballsPerOver,
            playersA: playersA.map(p => p.trim()),
            playersB: playersB.map(p => p.trim()),
        });
        setIsSubmitting(false);
        navigate(`/match/${matchId}`);
    };

    return (
        <div className="flex flex-col h-screen bg-neutral-900 p-6">
            <header className="mb-8 mt-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    Gully Cricket
                </h1>
                <p className="text-neutral-400 text-sm">Offline Scorer</p>
            </header>

            <form onSubmit={handleStart} className="flex-1 space-y-6">
                {/* Teams Section */}
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-green-400 font-semibold uppercase text-xs tracking-wider">
                        <Users size={16} /> Teams
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Team A"
                            value={teamA}
                            onChange={e => setTeamA(e.target.value)}
                            className="w-full bg-neutral-800 border-none rounded-xl p-4 text-white placeholder-neutral-500 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Team B"
                            value={teamB}
                            onChange={e => setTeamB(e.target.value)}
                            className="w-full bg-neutral-800 border-none rounded-xl p-4 text-white placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                {/* Player Names Toggle */}
                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={() => setShowPlayerInputs(!showPlayerInputs)}
                        className="text-xs font-semibold text-neutral-400 uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2"
                    >
                        {showPlayerInputs ? '- Hide Player Names' : '+ Add Player Names (Optional)'}
                    </button>

                    {showPlayerInputs && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            {[teamA, teamB].map((team, tIdx) => (
                                <div key={tIdx} className="space-y-2">
                                    <div className="text-xs text-neutral-500 font-bold uppercase">{team || `Team ${tIdx + 1}`} Players</div>
                                    {Array.from({ length: 11 }).map((_, pIdx) => (
                                        <input
                                            key={pIdx}
                                            type="text"
                                            placeholder={`Player ${pIdx + 1}`}
                                            value={tIdx === 0 ? playersA[pIdx] : playersB[pIdx]}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (tIdx === 0) {
                                                    const newP = [...playersA];
                                                    newP[pIdx] = val;
                                                    setPlayersA(newP);
                                                } else {
                                                    const newP = [...playersB];
                                                    newP[pIdx] = val;
                                                    setPlayersB(newP);
                                                }
                                            }}
                                            className="w-full bg-neutral-800 border-none rounded-lg p-2 text-sm text-white placeholder-neutral-600 focus:ring-1 focus:ring-green-500 outline-none"
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-blue-400 font-semibold uppercase text-xs tracking-wider">
                        <Timer size={16} /> Match Settings
                    </label>

                    <div className="bg-neutral-800 rounded-xl p-4 flex justify-between items-center">
                        <span className="text-neutral-200">Overs</span>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setOvers(Math.max(1, overs - 1))}
                                className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-xl font-bold text-white transition-colors"
                            >-</button>
                            <span className="w-8 text-center font-mono text-xl">{overs}</span>
                            <button
                                type="button"
                                onClick={() => setOvers(Math.max(1, overs + 1))}
                                className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-xl font-bold text-white transition-colors"
                            >+</button>
                        </div>
                    </div>

                    <div className="bg-neutral-800 rounded-xl p-4 flex justify-between items-center">
                        <span className="text-neutral-200">Balls / Over</span>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setBallsPerOver(Math.max(1, ballsPerOver - 1))}
                                className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-xl font-bold text-white transition-colors"
                            >-</button>
                            <span className="w-8 text-center font-mono text-xl">{ballsPerOver}</span>
                            <button
                                type="button"
                                onClick={() => setBallsPerOver(Math.max(1, ballsPerOver + 1))}
                                className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-xl font-bold text-white transition-colors"
                            >+</button>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!teamA || !teamB || isSubmitting}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 active:scale-95 transition-all mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    START MATCH
                </button>
            </form>
        </div>
    );
}
