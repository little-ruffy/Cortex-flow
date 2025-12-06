"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950 transition-opacity duration-500 ease-in-out">
            <div className="animate-pulse">
                <Image
                    src="/logo.webp"
                    alt="App Logo"
                    width={150}
                    height={150}
                    className="h-32 w-32 object-contain"
                />
            </div>
        </div>
    );
}
