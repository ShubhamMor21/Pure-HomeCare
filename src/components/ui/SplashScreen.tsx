import { FC } from 'react';

const SplashScreen: FC = () => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background animate-fade-in">
            <div className="relative flex flex-col items-center gap-6">
                {/* Animated Logo */}
                <div className="animate-blink">
                    <img
                        src="/favicon.ico"
                        alt="Pure Homecare Logo"
                        className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl"
                    />
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Pure Homecare
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-[0.2em] animate-pulse">
                        VR Training Platform
                    </p>
                </div>

                {/* Loading segment */}
                <div className="mt-8 flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
