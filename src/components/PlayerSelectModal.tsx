import React from 'react';
import { Player } from '../types';
import { X, User } from 'lucide-react';

interface PlayerSelectModalProps {
    title: string;
    players: Player[];
    onSelect: (playerId: string) => void;
    onClose?: () => void; // Optional, some selections might be mandatory
}

export const PlayerSelectModal: React.FC<PlayerSelectModalProps> = ({ title, players, onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {players.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No eligible players found.
                        </div>
                    ) : (
                        players.map(player => (
                            <button
                                key={player.id}
                                onClick={() => onSelect(player.id)}
                                className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                                    <User size={20} className="text-gray-600 group-hover:text-blue-700" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">{player.name}</div>
                                    <div className="text-xs text-gray-500">
                                        Bat: {player.batting.runs} ({player.batting.balls}) | Bowl: {player.bowling.wickets}-{player.bowling.runsConceded}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
