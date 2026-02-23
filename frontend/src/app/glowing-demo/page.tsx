"use client";

import { GlowingEffectDemo } from "@/components/ui/demo";
import Link from "next/link";

export default function GlowingDemoPage() {
    return (
        <div className="page-container" style={{ maxWidth: "800px" }}>
            <div className="mb-8">
                <Link href="/" className="btn-secondary mb-4 inline-flex">
                    ← Back to App
                </Link>
                <h1 className="text-3xl font-bold gradient-text">Glowing Effect Demo</h1>
                <p className="text-muted-foreground mt-2">
                    Showcasing the interactive GlowingEffect component integrated with Tailwind CSS and Motion.
                </p>
            </div>

            <div className="glass-card p-4 md:p-8">
                <GlowingEffectDemo />
            </div>
        </div>
    );
}
