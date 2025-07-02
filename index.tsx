/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

const TOTAL_PUZZLES = 7;
// Passwords to unlock the subsequent puzzle.
const PASSWORDS: { [key: number]: string } = {
    2: '3141',
    3: '2718',
    4: '1618',
    5: '1414',
    6: '1732',
    7: '0693',
};

interface PuzzleWrapperProps {
    puzzleNumber: number;
    children: React.ReactNode;
}

const PuzzleWrapper = ({ puzzleNumber, children }: PuzzleWrapperProps) => {
    return (
        <div className="puzzle-content">
            <h2>Puzzle {puzzleNumber}</h2>
            {children}
        </div>
    );
}

// --- Puzzle 1: Domino Tiling ---
interface Domino {
    id: number;
    r: number;
    c: number;
    orientation: 'horizontal' | 'vertical';
    color: string;
}

const dominoColors = ['#ff6b6b', '#f06595', '#cc5de8', '#845ef7', '#5c7cfa', '#339af0', '#22b8cf', '#20c997', '#51cf66', '#94d82d', '#fcc419', '#ff922b'];

const Puzzle1 = () => {
    const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
    const [rotation, setRotation] = useState(0);
    const [history, setHistory] = useState<Domino[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isSolved, setIsSolved] = useState(false);
    const [hoverPreview, setHoverPreview] = useState<{ r: number; c: number } | null>(null);
    const nextDominoId = useRef(0);

    const dominoes = history[historyIndex];

    const coveredCells = useMemo(() => {
        const cells = new Set<string>();
        dominoes.forEach(domino => {
            cells.add(`${domino.r}-${domino.c}`);
            if (domino.orientation === 'horizontal') {
                cells.add(`${domino.r}-${domino.c + 1}`);
            } else {
                cells.add(`${domino.r + 1}-${domino.c}`);
            }
        });
        return cells;
    }, [dominoes]);

    const addDomino = (r: number, c: number) => {
        if (isSolved) return;
        if (orientation === 'horizontal' && c > 4) return;
        if (orientation === 'vertical' && r > 4) return;

        const newCell1 = `${r}-${c}`;
        const newCell2 = orientation === 'horizontal' ? `${r}-${c + 1}` : `${r + 1}-${c}`;
        if (coveredCells.has(newCell1) || coveredCells.has(newCell2)) {
            return;
        }

        const newDomino: Domino = {
            id: nextDominoId.current++,
            r,
            c,
            orientation,
            color: dominoColors[nextDominoId.current % dominoColors.length],
        };

        const newDominoes = [...dominoes, newDomino];
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newDominoes]);
        setHistoryIndex(newHistory.length);
    };

    const handleUndo = () => setHistoryIndex(prev => Math.max(0, prev - 1));
    const handleRedo = () => setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
    const handleReset = () => {
        setHistory([[]]);
        setHistoryIndex(0);
        setIsSolved(false);
        nextDominoId.current = 0;
    };
    
    const toggleOrientation = () => {
        if (isSolved) return;
        setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
        setRotation(prev => prev + 90);
    };

    useEffect(() => {
        if (coveredCells.size === 36) {
            setIsSolved(true);
        } else {
            setIsSolved(false);
        }
    }, [coveredCells]);

    return (
        <PuzzleWrapper puzzleNumber={1}>
            <p>Tile the 6x6 grid using 2x1 dominoes without overlapping. The puzzle is solved when all squares are covered.</p>
            <div className="puzzle-controls">
                <button
                    onClick={toggleOrientation}
                    disabled={isSolved}
                    aria-label={`Toggle domino orientation, current is ${orientation}`}
                    className="domino-control-button"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <div 
                        className="domino-icon"
                    >
                        <div className="domino-icon-part"></div>
                        <div className="domino-icon-part"></div>
                    </div>
                </button>
            </div>
            <div className="puzzle-grid-container">
                <div 
                    className="puzzle-grid six-by-six"
                    onMouseLeave={() => setHoverPreview(null)}
                >
                    {[...Array(36)].map((_, i) => {
                        const r = Math.floor(i / 6);
                        const c = i % 6;
                        return (
                            <div 
                                key={i} 
                                className="grid-cell" 
                                onClick={() => addDomino(r, c)}
                                onMouseEnter={() => setHoverPreview({ r, c })}
                            ></div>
                        );
                    })}
                    {dominoes.map(d => (
                         <div 
                            key={d.id} 
                            className={`domino ${d.orientation}`} 
                            style={{ 
                                '--r': d.r, 
                                '--c': d.c,
                                '--color': d.color,
                             } as React.CSSProperties}
                        >
                            <div className="domino-part"></div>
                            <div className="domino-part"></div>
                        </div>
                    ))}
                    {hoverPreview && (() => {
                        const { r, c } = hoverPreview;
                        const isHorizontal = orientation === 'horizontal';

                        if (isHorizontal && c > 4) return null;
                        if (!isHorizontal && r > 4) return null;

                        const cell1 = `${r}-${c}`;
                        const cell2 = isHorizontal ? `${r}-${c + 1}` : `${r + 1}-${c}`;

                        if (coveredCells.has(cell1) || coveredCells.has(cell2)) {
                            return null;
                        }

                        return (
                            <div
                                className={`domino-preview ${orientation}`}
                                style={{'--r': r, '--c': c} as React.CSSProperties}
                            >
                                <div className="domino-part-preview"></div>
                                <div className="domino-part-preview"></div>
                            </div>
                        );
                    })()}
                </div>
            </div>
             <div className="puzzle-actions">
                <button onClick={handleUndo} disabled={historyIndex === 0}>Undo</button>
                <button onClick={handleRedo} disabled={historyIndex === history.length - 1}>Redo</button>
                <button onClick={handleReset}>Reset</button>
            </div>
            <div className={`solution-area ${!isSolved ? 'hidden' : ''}`}>
                <p>Congratulations! You've solved Puzzle 1!</p>
                <p>You can now attempt to unlock the next puzzle.</p>
            </div>
        </PuzzleWrapper>
    );
};

// --- Puzzle 2: The Mutilated Chessboard ---
const Puzzle2 = () => {
    const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
    const [rotation, setRotation] = useState(0);
    const [history, setHistory] = useState<Domino[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [hoverPreview, setHoverPreview] = useState<{ r: number; c: number } | null>(null);
    const nextDominoId = useRef(0);

    const dominoes = history[historyIndex];

    const removedCells = useMemo(() => new Set(['0-0', '5-5']), []);

    const coveredCells = useMemo(() => {
        const cells = new Set<string>();
        dominoes.forEach(domino => {
            cells.add(`${domino.r}-${domino.c}`);
            if (domino.orientation === 'horizontal') {
                cells.add(`${domino.r}-${domino.c + 1}`);
            } else {
                cells.add(`${domino.r + 1}-${domino.c}`);
            }
        });
        return cells;
    }, [dominoes]);

    const addDomino = (r: number, c: number) => {
        if (orientation === 'horizontal' && c > 4) return;
        if (orientation === 'vertical' && r > 4) return;

        const newCell1 = `${r}-${c}`;
        const newCell2 = orientation === 'horizontal' ? `${r}-${c + 1}` : `${r + 1}-${c}`;
        
        if (removedCells.has(newCell1) || removedCells.has(newCell2)) return;
        if (coveredCells.has(newCell1) || coveredCells.has(newCell2)) return;

        const newDomino: Domino = {
            id: nextDominoId.current++,
            r,
            c,
            orientation,
            color: dominoColors[nextDominoId.current % dominoColors.length],
        };

        const newDominoes = [...dominoes, newDomino];
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newDominoes]);
        setHistoryIndex(newHistory.length);
    };

    const handleUndo = () => setHistoryIndex(prev => Math.max(0, prev - 1));
    const handleRedo = () => setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
    const handleReset = () => {
        setHistory([[]]);
        setHistoryIndex(0);
        nextDominoId.current = 0;
    };
    
    const toggleOrientation = () => {
        setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
        setRotation(prev => prev + 90);
    };

    return (
        <PuzzleWrapper puzzleNumber={2}>
            <p>Tile this 6x6 grid, with two corners removed, using 2x1 dominoes. There are 34 squares to cover.</p>
            <div className="puzzle-controls">
                <button
                    onClick={toggleOrientation}
                    aria-label={`Toggle domino orientation, current is ${orientation}`}
                    className="domino-control-button"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <div className="domino-icon">
                        <div className="domino-icon-part"></div>
                        <div className="domino-icon-part"></div>
                    </div>
                </button>
            </div>
            <div className="puzzle-grid-container">
                <div 
                    className="puzzle-grid six-by-six"
                    onMouseLeave={() => setHoverPreview(null)}
                >
                    {[...Array(36)].map((_, i) => {
                        const r = Math.floor(i / 6);
                        const c = i % 6;
                        const isRemoved = removedCells.has(`${r}-${c}`);
                        return (
                            <div 
                                key={i} 
                                className={`grid-cell ${isRemoved ? 'removed' : ''}`} 
                                onClick={() => !isRemoved && addDomino(r, c)}
                                onMouseEnter={() => !isRemoved && setHoverPreview({ r, c })}
                            ></div>
                        );
                    })}
                    {dominoes.map(d => (
                         <div 
                            key={d.id} 
                            className={`domino ${d.orientation}`} 
                            style={{ 
                                '--r': d.r, 
                                '--c': d.c,
                                '--color': d.color,
                             } as React.CSSProperties}
                        >
                            <div className="domino-part"></div>
                            <div className="domino-part"></div>
                        </div>
                    ))}
                    {hoverPreview && (() => {
                        const { r, c } = hoverPreview;
                        const isHorizontal = orientation === 'horizontal';

                        if (isHorizontal && c > 4) return null;
                        if (!isHorizontal && r > 4) return null;

                        const cell1 = `${r}-${c}`;
                        const cell2 = isHorizontal ? `${r}-${c + 1}` : `${r + 1}-${c}`;

                        if (coveredCells.has(cell1) || coveredCells.has(cell2) || removedCells.has(cell1) || removedCells.has(cell2)) {
                            return null;
                        }

                        return (
                            <div
                                className={`domino-preview ${orientation}`}
                                style={{'--r': r, '--c': c} as React.CSSProperties}
                            >
                                <div className="domino-part-preview"></div>
                                <div className="domino-part-preview"></div>
                            </div>
                        );
                    })()}
                </div>
            </div>
             <div className="puzzle-actions">
                <button onClick={handleUndo} disabled={historyIndex === 0}>Undo</button>
                <button onClick={handleRedo} disabled={historyIndex === history.length - 1}>Redo</button>
                <button onClick={handleReset}>Reset</button>
            </div>
        </PuzzleWrapper>
    );
};

// --- Puzzle 3: T-Tetromino Tiling ---
interface Tetromino {
    id: number;
    r: number; // anchor row
    c: number; // anchor col
    rotation: number; // 0, 90, 180, 270
    color: string;
}

const tetrominoColors = dominoColors;

const getTetrominoCells = (r: number, c: number, rotation: number): {r: number, c: number}[] => {
    // Anchor point is the center of the 3-block bar
    switch (rotation) {
        case 0: // Pointing up
            return [{r, c}, {r, c: c - 1}, {r, c: c + 1}, {r: r - 1, c}];
        case 90: // Pointing right
            return [{r, c}, {r: r - 1, c}, {r: r + 1, c}, {r, c: c + 1}];
        case 180: // Pointing down
            return [{r, c}, {r, c: c - 1}, {r, c: c + 1}, {r: r + 1, c}];
        case 270: // Pointing left
            return [{r, c}, {r: r - 1, c}, {r: r + 1, c}, {r, c: c - 1}];
        default:
            return [];
    }
}

const Puzzle3 = () => {
    const [logicalRotation, setLogicalRotation] = useState(0);
    const [visualRotation, setVisualRotation] = useState(0);
    const [history, setHistory] = useState<Tetromino[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isSolved, setIsSolved] = useState(false);
    const [hoverPreview, setHoverPreview] = useState<{ r: number; c: number } | null>(null);
    const nextPieceId = useRef(0);

    const pieces = history[historyIndex];

    const coveredCells = useMemo(() => {
        const cells = new Set<string>();
        pieces.forEach(piece => {
            getTetrominoCells(piece.r, piece.c, piece.rotation).forEach(cell => {
                cells.add(`${cell.r}-${cell.c}`);
            });
        });
        return cells;
    }, [pieces]);

    const addPiece = (r: number, c: number) => {
        if (isSolved) return;
        
        const newPieceShape = getTetrominoCells(r, c, logicalRotation);
        
        const isOutOfBounds = newPieceShape.some(cell => cell.r < 0 || cell.r > 7 || cell.c < 0 || cell.c > 7);
        if (isOutOfBounds) return;

        const isOverlapping = newPieceShape.some(cell => coveredCells.has(`${cell.r}-${cell.c}`));
        if (isOverlapping) return;

        const newPiece: Tetromino = {
            id: nextPieceId.current++,
            r,
            c,
            rotation: logicalRotation,
            color: tetrominoColors[nextPieceId.current % tetrominoColors.length],
        };

        const newPieces = [...pieces, newPiece];
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newPieces]);
        setHistoryIndex(newHistory.length);
    };
    
    const handleRotate = () => {
        if (isSolved) return;
        setLogicalRotation(prev => (prev + 90) % 360);
        setVisualRotation(prev => prev + 90);
    };

    const handleUndo = () => setHistoryIndex(prev => Math.max(0, prev - 1));
    const handleRedo = () => setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
    const handleReset = () => {
        setHistory([[]]);
        setHistoryIndex(0);
        setIsSolved(false);
        nextPieceId.current = 0;
    };

    useEffect(() => {
        if (coveredCells.size === 64) {
            setIsSolved(true);
        } else {
            setIsSolved(false);
        }
    }, [coveredCells]);
    
    const renderPieces = (pieceList: Tetromino[]) => {
        return pieceList.flatMap(p => 
            getTetrominoCells(p.r, p.c, p.rotation).map((cell, i) => (
                <div 
                    key={`${p.id}-${i}`}
                    className="tetromino-block"
                    style={{
                        '--r': cell.r,
                        '--c': cell.c,
                        '--color': p.color
                    } as React.CSSProperties}
                ></div>
            ))
        );
    };

    const renderPreview = (r: number, c: number) => {
        const shape = getTetrominoCells(r, c, logicalRotation);
        const isOutOfBounds = shape.some(cell => cell.r < 0 || cell.r > 7 || cell.c < 0 || cell.c > 7);
        if (isOutOfBounds) return null;

        const isOverlapping = shape.some(cell => coveredCells.has(`${cell.r}-${cell.c}`));
        if (isOverlapping) return null;
        
        return shape.map((cell, i) => (
            <div 
                key={`preview-${i}`}
                className="tetromino-block-preview"
                style={{
                    '--r': cell.r,
                    '--c': cell.c
                } as React.CSSProperties}
            ></div>
        ));
    };

    return (
        <PuzzleWrapper puzzleNumber={3}>
            <p>Tile the 8x8 grid using T-tetrominoes without overlapping.</p>
            <div className="puzzle-controls tetromino-controls">
                <button
                    onClick={handleRotate}
                    disabled={isSolved}
                    aria-label={`Rotate T-tetromino, current rotation is ${logicalRotation} degrees`}
                    style={{ transform: `rotate(${visualRotation}deg)` }}
                >
                    <div className="tetromino-outline">
                        <svg viewBox="0 0 84 58" preserveAspectRatio="none">
                            <path d="M 26,6 A 6 6 0 0 1 32,0 H 52 A 6 6 0 0 1 58,6 V 26 H 78 A 6 6 0 0 1 84,32 V 52 A 6 6 0 0 1 79,58 H 6 A 6 6 0 0 1 0,52 V 32 A 6 6 0 0 1 6,26 H 26 V 7 A 6 6 0 0 1 26,7 Z" />
                        </svg>
                    </div>
                    <div className="tetromino-icon">
                        <div className="tetromino-icon-part"></div>
                        <div className="tetromino-icon-part"></div>
                        <div className="tetromino-icon-part"></div>
                        <div className="tetromino-icon-part"></div>
                    </div>
                </button>
            </div>
            <div className="puzzle-grid-container">
                <div 
                    className="puzzle-grid eight-by-eight"
                    onMouseLeave={() => setHoverPreview(null)}
                >
                    {[...Array(64)].map((_, i) => {
                        const r = Math.floor(i / 8);
                        const c = i % 8;
                        return (
                            <div 
                                key={i} 
                                className="grid-cell" 
                                onClick={() => addPiece(r, c)}
                                onMouseEnter={() => setHoverPreview({ r, c })}
                            ></div>
                        );
                    })}
                    {renderPieces(pieces)}
                    {hoverPreview && renderPreview(hoverPreview.r, hoverPreview.c)}
                </div>
            </div>
             <div className="puzzle-actions">
                <button onClick={handleUndo} disabled={historyIndex === 0}>Undo</button>
                <button onClick={handleRedo} disabled={historyIndex === history.length - 1}>Redo</button>
                <button onClick={handleReset}>Reset</button>
            </div>
            <div className={`solution-area ${!isSolved ? 'hidden' : ''}`}>
                <p>Congratulations! You've solved Puzzle 3!</p>
                <p>You can now attempt to unlock the next puzzle.</p>
            </div>
        </PuzzleWrapper>
    );
};

// --- Puzzle 4: T-Tetromino Tiling on 6x6 grid ---
const Puzzle4 = () => {
    const [logicalRotation, setLogicalRotation] = useState(0);
    const [visualRotation, setVisualRotation] = useState(0);
    const [history, setHistory] = useState<Tetromino[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isSolved, setIsSolved] = useState(false);
    const [hoverPreview, setHoverPreview] = useState<{ r: number; c: number } | null>(null);
    const nextPieceId = useRef(0);

    const pieces = history[historyIndex];

    const coveredCells = useMemo(() => {
        const cells = new Set<string>();
        pieces.forEach(piece => {
            getTetrominoCells(piece.r, piece.c, piece.rotation).forEach(cell => {
                cells.add(`${cell.r}-${cell.c}`);
            });
        });
        return cells;
    }, [pieces]);

    const addPiece = (r: number, c: number) => {
        if (isSolved) return;
        
        const newPieceShape = getTetrominoCells(r, c, logicalRotation);
        
        const isOutOfBounds = newPieceShape.some(cell => cell.r < 0 || cell.r > 5 || cell.c < 0 || cell.c > 5);
        if (isOutOfBounds) return;

        const isOverlapping = newPieceShape.some(cell => coveredCells.has(`${cell.r}-${cell.c}`));
        if (isOverlapping) return;

        const newPiece: Tetromino = {
            id: nextPieceId.current++,
            r,
            c,
            rotation: logicalRotation,
            color: tetrominoColors[nextPieceId.current % tetrominoColors.length],
        };

        const newPieces = [...pieces, newPiece];
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newPieces]);
        setHistoryIndex(newHistory.length);
    };
    
    const handleRotate = () => {
        if (isSolved) return;
        setLogicalRotation(prev => (prev + 90) % 360);
        setVisualRotation(prev => prev + 90);
    };

    const handleUndo = () => setHistoryIndex(prev => Math.max(0, prev - 1));
    const handleRedo = () => setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
    const handleReset = () => {
        setHistory([[]]);
        setHistoryIndex(0);
        setIsSolved(false);
        nextPieceId.current = 0;
    };

    useEffect(() => {
        if (coveredCells.size === 36) {
            setIsSolved(true);
        } else {
            setIsSolved(false);
        }
    }, [coveredCells]);
    
    const renderPieces = (pieceList: Tetromino[]) => {
        return pieceList.flatMap(p => 
            getTetrominoCells(p.r, p.c, p.rotation).map((cell, i) => (
                <div 
                    key={`${p.id}-${i}`}
                    className="tetromino-block"
                    style={{
                        '--r': cell.r,
                        '--c': cell.c,
                        '--color': p.color
                    } as React.CSSProperties}
                ></div>
            ))
        );
    };

    const renderPreview = (r: number, c: number) => {
        const shape = getTetrominoCells(r, c, logicalRotation);
        const isOutOfBounds = shape.some(cell => cell.r < 0 || cell.r > 5 || cell.c < 0 || cell.c > 5);
        if (isOutOfBounds) return null;

        const isOverlapping = shape.some(cell => coveredCells.has(`${cell.r}-${cell.c}`));
        if (isOverlapping) return null;
        
        return shape.map((cell, i) => (
            <div 
                key={`preview-${i}`}
                className="tetromino-block-preview"
                style={{
                    '--r': cell.r,
                    '--c': cell.c
                } as React.CSSProperties}
            ></div>
        ));
    };

    return (
        <PuzzleWrapper puzzleNumber={4}>
            <p>Tile the 6x6 grid using T-tetrominoes without overlapping.</p>
            <div className="puzzle-controls tetromino-controls">
                <button
                    onClick={handleRotate}
                    disabled={isSolved}
                    aria-label={`Rotate T-tetromino, current rotation is ${logicalRotation} degrees`}
                    style={{ transform: `rotate(${visualRotation}deg)` }}
                >
                    <div className="tetromino-outline">
                        <svg viewBox="0 0 84 58" preserveAspectRatio="none">
                            <path d="M 26,6 A 6 6 0 0 1 32,0 H 52 A 6 6 0 0 1 58,6 V 26 H 78 A 6 6 0 0 1 84,32 V 52 A 6 6 0 0 1 79,58 H 6 A 6 6 0 0 1 0,52 V 32 A 6 6 0 0 1 6,26 H 26 V 7 A 6 6 0 0 1 26,7 Z" />
                        </svg>
                    </div>
                    <div className="tetromino-icon">
                        <div className="tetromino-icon-part"></div>
                        <div className="tetromino-icon-part"></div>
                        <div className="tetromino-icon-part"></div>
                        <div className="tetromino-icon-part"></div>
                    </div>
                </button>
            </div>
            <div className="puzzle-grid-container">
                <div 
                    className="puzzle-grid six-by-six"
                    onMouseLeave={() => setHoverPreview(null)}
                >
                    {[...Array(36)].map((_, i) => {
                        const r = Math.floor(i / 6);
                        const c = i % 6;
                        return (
                            <div 
                                key={i} 
                                className="grid-cell" 
                                onClick={() => addPiece(r, c)}
                                onMouseEnter={() => setHoverPreview({ r, c })}
                            ></div>
                        );
                    })}
                    {renderPieces(pieces)}
                    {hoverPreview && renderPreview(hoverPreview.r, hoverPreview.c)}
                </div>
            </div>
             <div className="puzzle-actions">
                <button onClick={handleUndo} disabled={historyIndex === 0}>Undo</button>
                <button onClick={handleRedo} disabled={historyIndex === history.length - 1}>Redo</button>
                <button onClick={handleReset}>Reset</button>
            </div>
            <div className={`solution-area ${!isSolved ? 'hidden' : ''}`}>
                <p>Congratulations! You've solved Puzzle 4!</p>
                <p>You can now attempt to unlock the next puzzle.</p>
            </div>
        </PuzzleWrapper>
    );
};

// --- Puzzle 5: T-Tetromino and a Square ---
interface TBlock {
    type: 'T';
    id: number;
    r: number;
    c: number;
    rotation: number;
    color: string;
}
interface SquareBlock {
    type: 'square';
    id: number;
    r: number; // top-left
    c: number; // top-left
    color: string;
}
type PlacedPiece = TBlock | SquareBlock;

const getSquareTetrominoCells = (r: number, c: number): {r: number, c: number}[] => {
    return [{r, c}, {r, c: c + 1}, {r: r + 1, c}, {r: r + 1, c: c + 1}];
};

const Puzzle5 = () => {
    const [activePieceType, setActivePieceType] = useState<'T' | 'square'>('T');
    const [logicalRotation, setLogicalRotation] = useState(0);
    const [visualRotation, setVisualRotation] = useState(0);
    const [history, setHistory] = useState<PlacedPiece[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [hoverPreview, setHoverPreview] = useState<{ r: number; c: number } | null>(null);
    const nextPieceId = useRef(0);

    const pieces = history[historyIndex];

    const { coveredCells, isSquarePlaced, squareCoveredCells } = useMemo(() => {
        const cells = new Set<string>();
        let squarePlaced = false;
        const sqCovered = new Set<string>();

        pieces.forEach(piece => {
            const pieceCells = piece.type === 'T'
                ? getTetrominoCells(piece.r, piece.c, piece.rotation)
                : getSquareTetrominoCells(piece.r, piece.c);
            
            pieceCells.forEach(cell => {
                const key = `${cell.r}-${cell.c}`;
                cells.add(key);
                if (piece.type === 'square') {
                    sqCovered.add(key);
                }
            });

            if (piece.type === 'square') {
                squarePlaced = true;
            }
        });
        return { coveredCells: cells, isSquarePlaced: squarePlaced, squareCoveredCells: sqCovered };
    }, [pieces]);

    const addPiece = (r: number, c: number) => {
        let newPieceShape: {r: number, c: number}[];
        let isOutOfBounds: boolean;

        if (activePieceType === 'T') {
            newPieceShape = getTetrominoCells(r, c, logicalRotation);
            isOutOfBounds = newPieceShape.some(cell => cell.r < 0 || cell.r > 7 || cell.c < 0 || cell.c > 7);
        } else { // 'square'
            if (isSquarePlaced) return;
            newPieceShape = getSquareTetrominoCells(r, c);
            isOutOfBounds = newPieceShape.some(cell => cell.r < 0 || cell.r > 7 || cell.c < 0 || cell.c > 7);
        }
        
        if (isOutOfBounds) return;
        const isOverlapping = newPieceShape.some(cell => coveredCells.has(`${cell.r}-${cell.c}`));
        if (isOverlapping) return;

        const newPiece: PlacedPiece = activePieceType === 'T' ? {
            id: nextPieceId.current++,
            type: 'T',
            r, c,
            rotation: logicalRotation,
            color: tetrominoColors[nextPieceId.current % tetrominoColors.length],
        } : {
            id: nextPieceId.current++,
            type: 'square',
            r, c,
            color: tetrominoColors[nextPieceId.current % tetrominoColors.length],
        };

        const newPieces = [...pieces, newPiece];
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newPieces]);
        setHistoryIndex(newHistory.length);
    };
    
    const handleSelectOrRotateT = () => {
        if (activePieceType === 'T') {
            setLogicalRotation(prev => (prev + 90) % 360);
            setVisualRotation(prev => prev + 90);
        } else {
            setActivePieceType('T');
        }
    };

    const handleUndo = () => setHistoryIndex(prev => Math.max(0, prev - 1));
    const handleRedo = () => setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
    const handleReset = () => {
        setHistory([[]]);
        setHistoryIndex(0);
        nextPieceId.current = 0;
    };
    
    const renderPieces = (pieceList: PlacedPiece[]) => {
        return pieceList.flatMap(p => {
            const pieceCells = p.type === 'T'
                ? getTetrominoCells(p.r, p.c, p.rotation)
                : getSquareTetrominoCells(p.r, p.c);
            
            return pieceCells.map((cell, i) => (
                <div 
                    key={`${p.id}-${i}`}
                    className={`tetromino-block ${p.type === 'square' ? 'square-block' : ''}`}
                    style={{
                        '--r': cell.r,
                        '--c': cell.c,
                        '--color': p.color
                    } as React.CSSProperties}
                ></div>
            ));
        });
    };

    const renderPreview = (r: number, c: number) => {
        let shape: {r: number, c: number}[];
        let isOutOfBounds: boolean;

        if (activePieceType === 'T') {
            shape = getTetrominoCells(r, c, logicalRotation);
            isOutOfBounds = shape.some(cell => cell.r < 0 || cell.r > 7 || cell.c < 0 || cell.c > 7);
        } else {
            if (isSquarePlaced) return null;
            shape = getSquareTetrominoCells(r, c);
            isOutOfBounds = shape.some(cell => cell.r < 0 || cell.r > 7 || cell.c < 0 || cell.c > 7);
        }

        if (isOutOfBounds) return null;
        const isOverlapping = shape.some(cell => coveredCells.has(`${cell.r}-${cell.c}`));
        if (isOverlapping) return null;
        
        return shape.map((cell, i) => (
            <div 
                key={`preview-${i}`}
                className="tetromino-block-preview"
                style={{ '--r': cell.r, '--c': cell.c } as React.CSSProperties}
            ></div>
        ));
    };

    return (
        <PuzzleWrapper puzzleNumber={5}>
            <p>Can we tile an 8x8 grid using 15 T-tetrominoes and one square tetromino?</p>
            <div className="puzzle-controls tetromino-controls">
                <button
                    onClick={handleSelectOrRotateT}
                    aria-label={`Select or rotate T-tetromino, current rotation is ${logicalRotation} degrees`}
                    style={{ transform: `rotate(${visualRotation}deg)` }}
                    className={activePieceType === 'T' ? 'active-piece-control' : ''}
                >
                    <div className="tetromino-outline">
                         <svg viewBox="0 0 84 58" preserveAspectRatio="none">
                            <path d="M 26,6 A 6 6 0 0 1 32,0 H 52 A 6 6 0 0 1 58,6 V 26 H 78 A 6 6 0 0 1 84,32 V 52 A 6 6 0 0 1 79,58 H 6 A 6 6 0 0 1 0,52 V 32 A 6 6 0 0 1 6,26 H 26 V 7 A 6 6 0 0 1 26,7 Z" />
                        </svg>
                    </div>
                    <div className="tetromino-icon">
                        <div className="tetromino-icon-part"></div>
                        <div className="tetromino-icon-part"></div>
                        <div className="tetromino-icon-part"></div>
                        <div className="tetromino-icon-part"></div>
                    </div>
                </button>
                <button
                    onClick={() => setActivePieceType('square')}
                    disabled={isSquarePlaced}
                    aria-label="Select square tetromino"
                    className={`square-control-button ${activePieceType === 'square' ? 'active-piece-control' : ''}`}
                >
                    <div className="tetromino-outline">
                        <svg viewBox="0 0 56 56" preserveAspectRatio="none">
                           <path d="M 4,0 H 52 A 4 4 0 0 1 56,4 V 52 A 4 4 0 0 1 52,56 H 4 A 4 4 0 0 1 0,52 V 4 A 4 4 0 0 1 4,0 Z" />
                        </svg>
                    </div>
                    <div className="square-icon">
                        <div className="square-icon-part"></div>
                        <div className="square-icon-part"></div>
                        <div className="square-icon-part"></div>
                        <div className="square-icon-part"></div>
                    </div>
                </button>
            </div>
            <div className="puzzle-grid-container">
                <div 
                    className="puzzle-grid eight-by-eight"
                    onMouseLeave={() => setHoverPreview(null)}
                >
                    {[...Array(64)].map((_, i) => {
                        const r = Math.floor(i / 8);
                        const c = i % 8;
                        const isNoDrop = squareCoveredCells.has(`${r}-${c}`);
                        return (
                            <div 
                                key={i} 
                                className={`grid-cell ${isNoDrop ? 'no-drop' : ''}`} 
                                onClick={() => addPiece(r, c)}
                                onMouseEnter={() => setHoverPreview({ r, c })}
                            ></div>
                        );
                    })}
                    {renderPieces(pieces)}
                    {hoverPreview && renderPreview(hoverPreview.r, hoverPreview.c)}
                </div>
            </div>
             <div className="puzzle-actions">
                <button onClick={handleUndo} disabled={historyIndex === 0}>Undo</button>
                <button onClick={handleRedo} disabled={historyIndex === history.length - 1}>Redo</button>
                <button onClick={handleReset}>Reset</button>
            </div>
        </PuzzleWrapper>
    );
};


// --- Puzzle 7: Straight Triominoes and a Square ---
interface TriominoBlock {
    type: 'triomino';
    id: number;
    r: number; // anchor row
    c: number; // anchor col
    rotation: number; // 0 (vertical), 90 (horizontal)
    color: string;
}

interface SquareTile {
    type: 'square';
    id: number;
    r: number;
    c: number;
    color: string;
}

type PlacedPiece7 = TriominoBlock | SquareTile;

const getStraightTriominoCells = (r: number, c: number, rotation: number): {r: number, c: number}[] => {
    if (rotation === 0) { // Vertical
        return [{r, c}, {r: r - 1, c}, {r: r + 1, c}];
    } else { // Horizontal (90 degrees)
        return [{r, c}, {r, c: c - 1}, {r, c: c + 1}];
    }
}

const getSquareTileCell = (r: number, c: number): {r: number, c: number}[] => {
    return [{r, c}];
}

const Puzzle7 = () => {
    const [activePieceType, setActivePieceType] = useState<'triomino' | 'square'>('triomino');
    const [logicalRotation, setLogicalRotation] = useState(0);
    const [visualRotation, setVisualRotation] = useState(0);
    const [history, setHistory] = useState<PlacedPiece7[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [hoverPreview, setHoverPreview] = useState<{ r: number; c: number } | null>(null);
    const nextPieceId = useRef(0);

    const pieces = history[historyIndex];

    const { coveredCells, isSquarePlaced } = useMemo(() => {
        const cells = new Set<string>();
        let squarePlaced = false;
        pieces.forEach(piece => {
            const pieceCells = piece.type === 'triomino'
                ? getStraightTriominoCells(piece.r, piece.c, piece.rotation)
                : getSquareTileCell(piece.r, piece.c);
            
            pieceCells.forEach(cell => cells.add(`${cell.r}-${cell.c}`));

            if (piece.type === 'square') {
                squarePlaced = true;
            }
        });
        return { coveredCells: cells, isSquarePlaced: squarePlaced };
    }, [pieces]);

    const addPiece = (r: number, c: number) => {
        let newPieceShape: {r: number, c: number}[];
        let isOutOfBounds: boolean;

        if (activePieceType === 'triomino') {
            newPieceShape = getStraightTriominoCells(r, c, logicalRotation);
            isOutOfBounds = newPieceShape.some(cell => cell.r < 0 || cell.r > 4 || cell.c < 0 || cell.c > 4);
        } else { // 'square'
            if (isSquarePlaced) return;
            if (r === 2 && c === 2) return; // Center restriction
            newPieceShape = getSquareTileCell(r, c);
            isOutOfBounds = newPieceShape.some(cell => cell.r < 0 || cell.r > 4 || cell.c < 0 || cell.c > 4);
        }
        
        if (isOutOfBounds) return;
        const isOverlapping = newPieceShape.some(cell => coveredCells.has(`${cell.r}-${cell.c}`));
        if (isOverlapping) return;

        const newPiece: PlacedPiece7 = activePieceType === 'triomino' ? {
            id: nextPieceId.current++,
            type: 'triomino',
            r, c,
            rotation: logicalRotation,
            color: tetrominoColors[nextPieceId.current % tetrominoColors.length],
        } : {
            id: nextPieceId.current++,
            type: 'square',
            r, c,
            color: tetrominoColors[nextPieceId.current % tetrominoColors.length],
        };

        const newPieces = [...pieces, newPiece];
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newPieces]);
        setHistoryIndex(newHistory.length);
    };
    
    const handleSelectOrRotateTriomino = () => {
        if (activePieceType === 'triomino') {
            setLogicalRotation(prev => (prev + 90) % 180);
            setVisualRotation(prev => prev + 90);
        } else {
            setActivePieceType('triomino');
        }
    };

    const handleSelectSquare = () => {
        if (isSquarePlaced) return;
        setActivePieceType('square');
    }

    const handleUndo = () => setHistoryIndex(prev => Math.max(0, prev - 1));
    const handleRedo = () => setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
    const handleReset = () => {
        setHistory([[]]);
        setHistoryIndex(0);
        nextPieceId.current = 0;
    };
    
    const renderPieces = (pieceList: PlacedPiece7[]) => {
        return pieceList.flatMap(p => {
            const pieceCells = p.type === 'triomino'
                ? getStraightTriominoCells(p.r, p.c, p.rotation)
                : getSquareTileCell(p.r, p.c);
            
            return pieceCells.map((cell, i) => (
                <div 
                    key={`${p.id}-${i}`}
                    className="tetromino-block"
                    style={{
                        '--r': cell.r,
                        '--c': cell.c,
                        '--color': p.color
                    } as React.CSSProperties}
                ></div>
            ));
        });
    };

    const renderPreview = (r: number, c: number) => {
        let shape: {r: number, c: number}[];
        let isOutOfBounds: boolean;

        if (activePieceType === 'triomino') {
            shape = getStraightTriominoCells(r, c, logicalRotation);
            isOutOfBounds = shape.some(cell => cell.r < 0 || cell.r > 4 || cell.c < 0 || cell.c > 4);
        } else {
            if (isSquarePlaced) return null;
            if (r === 2 && c === 2) return null; // No preview on center cell for square
            shape = getSquareTileCell(r, c);
            isOutOfBounds = shape.some(cell => cell.r < 0 || cell.r > 4 || cell.c < 0 || cell.c > 4);
        }

        if (isOutOfBounds) return null;
        const isOverlapping = shape.some(cell => coveredCells.has(`${cell.r}-${cell.c}`));
        if (isOverlapping) return null;
        
        return shape.map((cell, i) => (
            <div 
                key={`preview-${i}`}
                className="tetromino-block-preview"
                style={{ '--r': cell.r, '--c': cell.c } as React.CSSProperties}
            ></div>
        ));
    };

    return (
        <PuzzleWrapper puzzleNumber={7}>
            <p>Is it possible to tile a 5 × 5 grid using 8 straight triominoes and 1 square tile, given that the square tile cannot be placed in the center cell of the grid?</p>
            <div className="puzzle-controls puzzle7-controls">
                <button
                    onClick={handleSelectOrRotateTriomino}
                    aria-label={`Select or rotate straight triomino`}
                    style={{ transform: `rotate(${visualRotation}deg)` }}
                    className={`triomino-control ${activePieceType === 'triomino' ? 'active-piece-control' : ''}`}
                >
                    <div className="tetromino-outline">
                        <svg viewBox="0 0 42 92" preserveAspectRatio="none">
                           <path d="M 8,2 H 34 A 6 6 0 0 1 40,8 V 84 A 6 6 0 0 1 34,90 H 8 A 6 6 0 0 1 2,84 V 8 A 6 6 0 0 1 8,2 Z" />
                        </svg>
                    </div>
                     <div className="triomino-icon">
                        <div className="triomino-icon-part"></div>
                        <div className="triomino-icon-part"></div>
                        <div className="triomino-icon-part"></div>
                    </div>
                </button>
                <button
                    onClick={handleSelectSquare}
                    disabled={isSquarePlaced}
                    aria-label="Select square tile"
                    className={`square-tile-control ${activePieceType === 'square' ? 'active-piece-control' : ''}`}
                >
                    <div className="tetromino-outline">
                        <svg viewBox="0 0 42 42" preserveAspectRatio="none">
                            <path d="M 8,2 H 34 A 6 6 0 0 1 40,8 V 34 A 6 6 0 0 1 34,40 H 8 A 6 6 0 0 1 2,34 V 8 A 6 6 0 0 1 8,2 Z" />
                        </svg>
                    </div>
                    <div className="square-tile-icon">
                        <div className="square-tile-icon-part"></div>
                    </div>
                </button>
            </div>
            <div className="puzzle-grid-container">
                <div 
                    className="puzzle-grid five-by-five"
                    onMouseLeave={() => setHoverPreview(null)}
                >
                    {[...Array(25)].map((_, i) => {
                        const r = Math.floor(i / 5);
                        const c = i % 5;
                        const isCenterNoDrop = activePieceType === 'square' && r === 2 && c === 2;
                        return (
                            <div 
                                key={i} 
                                className={`grid-cell ${isCenterNoDrop ? 'center-no-drop' : ''}`} 
                                onClick={() => addPiece(r, c)}
                                onMouseEnter={() => setHoverPreview({ r, c })}
                            ></div>
                        );
                    })}
                    {renderPieces(pieces)}
                    {hoverPreview && renderPreview(hoverPreview.r, hoverPreview.c)}
                </div>
            </div>
             <div className="puzzle-actions">
                <button onClick={handleUndo} disabled={historyIndex === 0}>Undo</button>
                <button onClick={handleRedo} disabled={historyIndex === history.length - 1}>Redo</button>
                <button onClick={handleReset}>Reset</button>
            </div>
        </PuzzleWrapper>
    );
};


// --- Fallback Puzzle Placeholder ---
interface PuzzlePlaceholderProps {
    puzzleNumber: number;
}

const PuzzlePlaceholder = ({ puzzleNumber }: PuzzlePlaceholderProps) => {
    const [isSolved, setIsSolved] = useState(false);

    const handleSolve = () => {
        setIsSolved(true);
    };

    const isFinalPuzzle = puzzleNumber === TOTAL_PUZZLES;

    return (
        <PuzzleWrapper puzzleNumber={puzzleNumber}>
            <p>The details for this puzzle have not been provided yet. For now, you can mark it as solved.</p>
            <button className="unlock-button" onClick={handleSolve} disabled={isSolved}>
                {isSolved ? 'Solved!' : 'Mark as Solved'}
            </button>
            <div className={`solution-area ${!isSolved ? 'hidden' : ''}`}>
                {isFinalPuzzle ? (
                    <p>Congratulations! You have solved all the puzzles!</p>
                ) : (
                    <p>Puzzle {puzzleNumber} solved! Try to unlock the next one.</p>
                )}
            </div>
        </PuzzleWrapper>
    );
};

// --- Lock Screen ---
interface LockScreenProps {
    puzzleNumber: number;
    onUnlock: () => void;
}

const LockScreen = ({ puzzleNumber, onUnlock }: LockScreenProps) => {
    const [password, setPassword] = useState(new Array(4).fill(''));
    const [error, setError] = useState('');
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (!/^\d*$/.test(element.value)) return;
        
        setPassword([...password.map((d, idx) => (idx === index) ? element.value : d)]);

        if (element.value && index < 3) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !password[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };
    
    const handlePaste = (e: React.ClipboardEvent) => {
        const paste = e.clipboardData.getData('text');
        if (/^\d{4}$/.test(paste)) {
            setPassword(paste.split(''));
            inputsRef.current[3]?.focus();
            e.preventDefault();
        }
    };

    const handleSubmit = () => {
        const enteredPassword = password.join('');
        if (enteredPassword === PASSWORDS[puzzleNumber]) {
            onUnlock();
        } else {
            setError('Incorrect Password');
            setPassword(new Array(4).fill(''));
            inputsRef.current[0]?.focus();
            setTimeout(() => setError(''), 2000);
        }
    };

    return (
        <div className="lock-screen">
            <h2>Puzzle {puzzleNumber} is locked</h2>
            <p>Enter the 4-digit password</p>
            <div className="password-inputs" onPaste={handlePaste}>
                {password.map((data, index) => (
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="password"
                        maxLength={1}
                        key={index}
                        value={data}
                        onChange={e => handleChange(e.target as HTMLInputElement, index)}
                        onKeyDown={e => handleKeyDown(e, index)}
                        ref={el => { inputsRef.current[index] = el; }}
                        aria-label={`Password digit ${index + 1}`}
                    />
                ))}
            </div>
            <button className="unlock-button" onClick={handleSubmit}>Unlock</button>
            <p className="error-message">{error}</p>
        </div>
    );
};

// --- Main App ---
const App = () => {
    const [currentPuzzle, setCurrentPuzzle] = useState(1);
    const [unlockedPuzzles, setUnlockedPuzzles] = useState(() => {
        try {
            const saved = localStorage.getItem('unlockedPuzzles');
            return saved ? JSON.parse(saved) : [true, ...new Array(TOTAL_PUZZLES - 1).fill(false)];
        } catch {
            return [true, ...new Array(TOTAL_PUZZLES - 1).fill(false)];
        }
    });

    useEffect(() => {
        localStorage.setItem('unlockedPuzzles', JSON.stringify(unlockedPuzzles));
    }, [unlockedPuzzles]);

    const handleUnlock = (puzzleNumber: number) => {
        const newUnlocked = [...unlockedPuzzles];
        newUnlocked[puzzleNumber - 1] = true;
        setUnlockedPuzzles(newUnlocked);
    };

    const renderPuzzleContent = () => {
        if (!unlockedPuzzles[currentPuzzle - 1]) {
            return <LockScreen puzzleNumber={currentPuzzle} onUnlock={() => handleUnlock(currentPuzzle)} />;
        }
        
        switch (currentPuzzle) {
            case 1:
                return <Puzzle1 />;
            case 2:
                return <Puzzle2 />;
            case 3:
                return <Puzzle3 />;
            case 4:
                return <Puzzle4 />;
            case 5:
                return <Puzzle5 />;
            case 7:
                return <Puzzle7 />;
            default:
                return <PuzzlePlaceholder puzzleNumber={currentPuzzle} />;
        }
    };

    return (
        <div>
            <h1>Tiling and Coloring Puzzles</h1>
            <nav>
                {[...Array(TOTAL_PUZZLES)].map((_, i) => (
                    <button
                        key={i}
                        className={`${currentPuzzle === i + 1 ? 'active' : ''} ${!unlockedPuzzles[i] ? 'locked' : ''}`}
                        onClick={() => setCurrentPuzzle(i + 1)}
                        aria-label={`Go to puzzle ${i + 1}`}
                    >
                        {i + 1}
                    </button>
                ))}
            </nav>
            <main className="puzzle-container">
                {renderPuzzleContent()}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);