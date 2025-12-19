import { Check, Lock } from 'lucide-react';

interface ConfirmLockModalProps {
    onConfirm: () => void;
    teamA: string;
    teamB: string;
}

export default function ConfirmLockModal({ onConfirm, teamA, teamB }: ConfirmLockModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center mb-2">
                        <Lock size={32} />
                    </div>

                    <h2 className="text-2xl font-bold text-white">Over Complete</h2>
                    <p className="text-neutral-400 text-sm">
                        <span className="text-white font-semibold">{teamA}</span> and <span className="text-white font-semibold">{teamB}</span> must confirm. <br />
                        <span className="text-red-400 font-semibold">This cannot be undone.</span>
                    </p>

                    <div className="w-full space-y-3 mt-4">
                        <button
                            onClick={onConfirm}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <Check size={20} />
                            Confirm & Lock
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
