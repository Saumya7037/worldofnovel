import { useState, useEffect } from 'react'

export const GENRES = [
    {
        name: 'Dark Knight',
        image: '/images/dark_knight.jpg',
        accent: 'text-amber-500'
    },
    {
        name: 'Dragon Fire',
        image: '/images/dragon.jpg',
        accent: 'text-red-500'
    },
    {
        name: 'Darkness',
        image: '/images/darkness.jpg',
        accent: 'text-purple-500'
    },
    {
        name: 'Shadows',
        image: '/images/shadows.jpg',
        accent: 'text-indigo-400'
    }
]

export function BackgroundSlider({ className = '' }: { className?: string }) {
    const [currentGenre, setCurrentGenre] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentGenre((prev) => (prev + 1) % GENRES.length)
        }, 8000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className={`fixed inset-0 z-0 overflow-hidden ${className}`}>
            {GENRES.map((genre, idx) => (
                <img
                    key={genre.name}
                    src={genre.image}
                    alt={genre.name}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentGenre ? 'opacity-100' : 'opacity-0'}`}
                />
            ))}
            <div className="absolute inset-0 bg-black/60 pointer-events-none" />
        </div>
    )
}
