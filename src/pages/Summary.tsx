import { useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import { toPng } from 'html-to-image';
import { Share2, Home } from 'lucide-react';
import MatchResultCard from '../components/MatchResultCard';

export default function Summary() {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { currentMatch, loadMatch } = useMatchStore();
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!currentMatch && matchId) {
            loadMatch(matchId);
        }
    }, [matchId, currentMatch, loadMatch]);

    const handleShare = useCallback(async () => {
        if (cardRef.current) {
            try {
                const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });

                // Generate a blob to share using Web Share API if available
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], 'match-result.png', { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Match Result',
                        text: `Check out the match result between ${currentMatch?.teamA} and ${currentMatch?.teamB}!`
                    });
                } else {
                    // Fallback: Download
                    const link = document.createElement('a');
                    link.download = 'match-result.png';
                    link.href = dataUrl;
                    link.click();
                }
            } catch (err) {
                console.error('Failed to generate image', err);
                alert('Could not generate image. Please try again.');
            }
        }
    }, [currentMatch]);

    if (!currentMatch) return <div>Match not found</div>;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center p-6 pt-12">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Match Summary</h1>

            <div className="mb-8">
                <MatchResultCard match={currentMatch} ref={cardRef} />
            </div>

            <div className="w-full max-w-xs space-y-4">
                <button
                    onClick={handleShare}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                >
                    <Share2 size={20} />
                    Share Scorecard
                </button>

                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                    <Home size={20} />
                    Back to Home
                </button>
            </div>
        </div>
    );
}
