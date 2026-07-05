"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import styles from './Hero.module.css';

const Hero = () => {
    const router = useRouter();
    const { user } = useAuth();

    const handleJoinClick = () => {
        if (user) {
            if (user.role === 'manufacturer') {
                router.push('/manufacturer/dashboard');
            } else if (user.role === 'wholesaler') {
                router.push('/wholesaler/dashboard');
            } else if (user.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/industries');
            }
        } else {
            router.push('/register');
        }
    };

    return (
        <section className={styles.hero}>
            <div className={styles.heroBackground}>
                <img
                    src="/assets/images/Babar azam.webp"
                    alt="Babar Azam Hero"
                    className={styles.heroImage}
                />
                <div className={styles.heroGradientOverlay}></div>
            </div>
            <div className={`${styles.heroContent} container mx-auto`}>
                <div className={styles.heroText}>
                    <h1 className={styles.heroHeadline}>
                        Where Sports Manufacturing
                        <span className={styles.headlineAccent}> Meets Digital Trade</span>
                    </h1>
                    <p className={styles.heroSubheadline}>
                        Connect with verified manufacturers, streamline bulk ordering, and transform your sports goods business with Pakistan's premier B2B marketplace.
                    </p>
                    <div className={styles.heroCtas}>
                        <button
                            onClick={handleJoinClick}
                            className={styles.btnPrimaryHero}
                            aria-label={user ? "Go to Dashboard" : "Join as Business"}
                        >
                            {user ? "Go to Dashboard" : "Join as Business"}
                        </button>
                        <button
                            onClick={() => router.push('/industries')}
                            className={styles.btnSecondaryHero}
                            aria-label="View Industries"
                        >
                            View Industries
                        </button>
                    </div>
                </div>
            </div>
            <div className={styles.heroScrollIndicator}>
                <div className={styles.scrollLine}></div>
            </div>
        </section>
    );
};

export default Hero;
