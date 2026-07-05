"use client";

import React from 'react';
import { X, Check, ArrowRight } from 'lucide-react';
import styles from './MarketTransformation.module.css';

const MarketTransformation = () => {
    return (
        <section className={styles.marketTransformation}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={styles.transformationHeader}>
                    <h2 className={styles.sectionTitle}>Transforming Sports Trade in Pakistan</h2>
                    <p className={styles.sectionSubtitle}>
                        Move away from the inefficiencies of traditional trade and embrace the future of digital B2B commerce.
                    </p>
                </div>

                <div className={styles.transformationGrid}>
                    {/* Traditional Trade (Left) */}
                    <div className={`${styles.tradeCard} ${styles.traditional}`}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>Traditional Trade</h3>
                            <div className={styles.cardBadge}>Current Reality</div>
                        </div>
                        <ul className={styles.featureList}>
                            <li>
                                <X className={styles.iconNegative} size={20} />
                                <span>Manual phone calls <span className="font-sans">&</span> paperwork</span>
                            </li>
                            <li>
                                <X className={styles.iconNegative} size={20} />
                                <span>Limited supplier visibility</span>
                            </li>
                            <li>
                                <X className={styles.iconNegative} size={20} />
                                <span>Delayed order processing</span>
                            </li>
                            <li>
                                <X className={styles.iconNegative} size={20} />
                                <span>No real-time data or insights</span>
                            </li>
                        </ul>
                    </div>

                    {/* Transformation Arrow */}
                    <div className={styles.transformationArrow}>
                        <div className={styles.arrowCircle}>
                            <ArrowRight size={24} />
                        </div>
                    </div>

                    {/* GearUp Digital Trade (Right) */}
                    <div className={`${styles.tradeCard} ${styles.gearup}`}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>GearUp Digital Trade</h3>
                            <div className={styles.cardBadge}>The Future</div>
                        </div>
                        <ul className={styles.featureList}>
                            <li>
                                <div className={styles.iconBox}>
                                    <Check size={18} strokeWidth={3} />
                                </div>
                                <span>Real-time digital marketplace</span>
                            </li>
                            <li>
                                <div className={styles.iconBox}>
                                    <Check size={18} strokeWidth={3} />
                                </div>
                                <span>Verified supplier ecosystem</span>
                            </li>
                            <li>
                                <div className={styles.iconBox}>
                                    <Check size={18} strokeWidth={3} />
                                </div>
                                <span>Automated bulk order management</span>
                            </li>
                            <li>
                                <div className={styles.iconBox}>
                                    <Check size={18} strokeWidth={3} />
                                </div>
                                <span>Advanced analytics <span className="font-sans">&</span> insights</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MarketTransformation;
