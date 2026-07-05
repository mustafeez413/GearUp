import React from 'react';
import Link from 'next/link';
import { ArrowRight, Activity, Trophy } from 'lucide-react';
import styles from './IndustryFocus.module.css';

const IndustryFocus = () => {
    const industries = [
        {
            id: 'cricket',
            name: 'Cricket Manufacturing',
            icon: <Trophy size={32} />,
            stats: '450+ Manufacturers',
            desc: 'World-class bats, balls, and protective gear from Sialkot.',
            link: '/cricket-manufacturing'
        },
        {
            id: 'football',
            name: 'Football Manufacturing',
            icon: <Activity size={32} />,
            stats: '380+ Manufacturers',
            desc: 'FIFA-standard footballs and team wear production hubs.',
            link: '/football-manufacturing'
        }
    ];

    return (
        <section className={styles.industrySection}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className={styles.sectionHeadline}>Pakistan's Core Manufacturing Industries</h2>
                    <p className={styles.sectionSubheadline}>
                        Connect directly with verified manufacturers in key sports sectors.
                    </p>
                </div>

                <div className={styles.industryGrid}>
                    {industries.map((industry) => (
                        <Link href={industry.link} key={industry.id} className={styles.industryCard}>
                            <div className={styles.industryIconWrapper}>
                                {industry.icon}
                            </div>
                            <h3 className={styles.industryTitle}>{industry.name}</h3>
                            <p className={styles.industryStats}>{industry.stats}</p>
                            <p className={styles.industryDesc}>{industry.desc}</p>
                            <div className={styles.industryCta}>
                                Explore Industry <ArrowRight size={16} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default IndustryFocus;
