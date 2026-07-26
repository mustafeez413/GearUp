"use client";

import React from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import { ArrowRight, Linkedin, Github, Mail } from 'lucide-react';

const About = () => {
    return (
        <PublicLayout>
            <div className="min-h-screen relative pt-32 pb-24 overflow-hidden">
                {/* Modern Dynamic Background — identical to Contact page */}
                <div className="absolute inset-0 bg-[#F8FAFC] z-0" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-[#00A878]/10 to-transparent rounded-[100%] blur-[100px] z-0" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] z-0" />
                <div className="absolute top-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] z-0" />

                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                    {/* Page Header */}
                    <div className="text-center mb-16 animate-in slide-in-from-bottom-5 fade-in duration-700">
                        <span className="inline-block py-1.5 px-4 rounded-full bg-white border border-[#E5E7EB] text-[12px] font-bold text-[#00A878] tracking-widest uppercase mb-6 shadow-sm">
                            About Us
                        </span>
                        <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-[#0F172A] mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0F172A] to-slate-600">
                            About GearUp
                        </h1>
                        <p className="font-body text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            Transforming Pakistan's sports goods industry through digital innovation
                        </p>
                    </div>

                    <div className="space-y-12 animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-150">

                        {/* Our Mission — Dark Glassmorphic Card */}
                        <div className="relative overflow-hidden rounded-[24px] bg-[#0B1121] text-white p-8 md:p-10 shadow-2xl border border-white/10">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#00A878]/30 to-[#00A878]/0 blur-3xl" />
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/0 blur-3xl" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00A878]" />
                                    <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-300">OUR MISSION</h2>
                                </div>
                                <h3 className="text-[28px] md:text-[32px] font-[800] leading-tight tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                    Building the Future of Pakistan's Sports Trade
                                </h3>
                                <p className="text-[16px] text-slate-400 font-medium leading-relaxed mb-6">
                                    GearUp is a dedicated B2B marketplace that connects manufacturers and wholesalers across Pakistan through one secure and reliable platform. We make it easier for businesses to find trusted partners, manage bulk orders, and grow through digital solutions.
                                </p>
                                <p className="text-[16px] text-slate-400 font-medium leading-relaxed mb-6">
                                    Our goal is to simplify trade, strengthen business relationships, and support the continued growth of Pakistan's sports industry by making buying and selling more efficient, transparent, and accessible.
                                </p>
                                <p className="text-[16px] font-[700] text-white tracking-wide">
                                    Connecting Businesses. Building Trust. Growing Together.
                                </p>
                            </div>
                        </div>

                        {/* Who We Serve */}
                        <div>
                            <div className="text-center mb-8">
                                <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0F172A] to-slate-600">
                                    Who We Serve
                                </h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                {[
                                    {
                                        title: '🏭 Manufacturers',
                                        desc: 'Grow your business by showcasing your products to verified wholesalers across Pakistan. Easily manage your product catalog, receive bulk orders, and build long-term partnerships with trusted buyers through one dedicated B2B platform.',
                                        color: 'from-[#00A878] to-[#009166]'
                                    },
                                    {
                                        title: '📦 Wholesalers',
                                        desc: 'Find verified manufacturers, explore a wide range of quality sports products, compare suppliers, and place bulk orders with confidence. GearUp helps you source products more efficiently while building reliable business relationships.',
                                        color: 'from-blue-500 to-indigo-600'
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="group bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 relative overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,168,120,0.15)] transition-all duration-500 hover:-translate-y-1">
                                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                        <h3 className="font-heading text-xl font-bold text-[#0F172A] mb-3">{item.title}</h3>
                                        <p className="font-body text-[15px] text-slate-600 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Why Choose GearUp */}
                        <div>
                            <div className="text-center mb-8">
                                <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0F172A] to-slate-600">
                                    Why Choose GearUp
                                </h2>
                            </div>
                            <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {[
                                        { title: "✅ Verified Business Network", desc: "Every business on GearUp goes through a verification process to help create a trusted marketplace where manufacturers and wholesalers can connect with confidence." },
                                        { title: "📦 Simplified Bulk Ordering", desc: "From product discovery to order placement, GearUp streamlines the wholesale buying process, making bulk transactions faster, more organized, and easier to manage." },
                                        { title: "🤖 AI-Powered Assistance", desc: "Our intelligent AI assistant provides instant support, answers common questions, and helps users navigate the platform, ensuring a smoother experience." },
                                        { title: "📊 Smart Business Dashboard", desc: "Manage your products, monitor orders, track business activity, and access key information from one centralized dashboard designed for efficient business management." },
                                        { title: "🔒 Secure & Reliable Platform", desc: "GearUp uses modern security practices to protect your business information and provide a safe, reliable environment for every transaction and interaction." },
                                        { title: "🇵🇰 Designed for Pakistan's Sports Industry", desc: "Built specifically for Pakistan's sports goods sector, GearUp connects manufacturers and wholesalers through a single digital marketplace, making business collaboration simpler, faster, and more transparent." }
                                    ].map((item, idx) => (
                                        <div key={idx} className="group flex items-start gap-4 p-5 bg-[#F8FAFC] border border-transparent rounded-[16px] hover:bg-white hover:border-[#00A878]/20 hover:shadow-sm transition-all duration-300">
                                            <div>
                                                <h4 className="font-heading font-bold text-[16px] text-[#0F172A] mb-1.5">{item.title}</h4>
                                                <p className="font-body text-[14px] text-slate-600 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Our Leadership */}
                        <div>
                            <div className="text-center mb-10">
                                <span className="inline-block py-1 px-3.5 rounded-full bg-emerald-50 text-[#00A878] text-[11px] font-extrabold uppercase tracking-widest border border-emerald-200/60 mb-3">
                                    Leadership Team
                                </span>
                                <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0F172A] to-slate-600 mb-3">
                                    Our Leadership
                                </h2>
                                <p className="font-body text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                                    Meet the team behind GearUp, dedicated to building a trusted B2B marketplace for Pakistan's sports goods industry.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mt-8">
                                {[
                                    {
                                        name: "Mustafeez ur Rehman",
                                        role: "Co-Founder",
                                        specialization: "Backend Development & System Architecture",
                                        description: "Designs and develops the platform's backend infrastructure, APIs, database architecture, and core business logic while ensuring security, scalability, and high performance.",
                                        image: "/team/mustafeez.png",
                                        socials: {
                                            linkedin: "https://www.linkedin.com/in/mustafeez-ur-rehman-42029034a/",
                                            github: "https://github.com/mustafeez413",
                                            email: "mailto:mustafeez413@gmail.com"
                                        }
                                    },
                                    {
                                        name: "Hamza Asif",
                                        role: "Co-Founder",
                                        specialization: "Frontend Development & UI/UX",
                                        description: "Leads the design and development of GearUp's user interface, creating a modern, responsive, and intuitive experience for manufacturers and wholesalers.",
                                        image: "/team/hamza.jpg",
                                        socials: {
                                            linkedin: "https://www.linkedin.com/in/hamza-asif-ghouri",
                                            github: "https://github.com/hamzhehe",
                                            email: "mailto:hamzaasifghouri786@gmail.com"
                                        }
                                    },
                                    {
                                        name: "Fazail Ishtiaq",
                                        role: "Co-Founder",
                                        specialization: "Product Management & Quality Assurance",
                                        description: "Oversees product planning, platform testing, feature improvements, and quality assurance to deliver a smooth and reliable user experience.",
                                        image: "/team/fazail.png",
                                        socials: {
                                            linkedin: "https://www.linkedin.com/in/fazail-ishtiaq",
                                            github: "https://github.com/fazailIshtiaq",
                                            email: "mailto:sardarfazail0@gmail.com"
                                        }
                                    }
                                ].map((member, idx) => (
                                    <div
                                        key={idx}
                                        className="group bg-white rounded-[24px] border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,168,120,0.18)] hover:border-[#00A878]/30 transition-all duration-500 hover:-translate-y-2 flex flex-col overflow-hidden relative"
                                    >
                                        {/* Card Top Accent Bar */}
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00A878] to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />

                                        {/* Image Container */}
                                        <div className="relative h-[340px] md:h-[360px] w-full overflow-hidden bg-slate-950/90">
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=022c22&color=fff&size=500`;
                                                }}
                                                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                                            
                                            {/* Role Pill overlay */}
                                            <div className="absolute top-4 left-4 z-10">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-white/90 backdrop-blur-md text-[#00A878] shadow-md border border-white/40">
                                                    {member.role}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Content Body */}
                                        <div className="p-6 md:p-7 flex flex-col flex-grow justify-between bg-white relative z-10">
                                            <div>
                                                <h3 className="font-heading text-xl font-bold text-[#0F172A] tracking-tight group-hover:text-[#00A878] transition-colors duration-300">
                                                    {member.name}
                                                </h3>
                                                <p className="font-body text-[13px] font-bold text-[#00A878] tracking-wide mt-1 mb-3">
                                                    {member.specialization}
                                                </p>
                                                <p className="font-body text-[14px] text-slate-600 leading-relaxed">
                                                    {member.description}
                                                </p>
                                            </div>

                                            {/* Optional Social Links */}
                                            {member.socials && (
                                                <div className="pt-5 mt-6 border-t border-slate-100 flex items-center gap-2 text-slate-400">
                                                    {member.socials.linkedin && (
                                                        <a
                                                            href={member.socials.linkedin}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label={`${member.name} LinkedIn`}
                                                            className="p-2 rounded-xl text-slate-400 hover:text-[#00A878] hover:bg-emerald-50 transition-all cursor-pointer"
                                                        >
                                                            <Linkedin size={18} />
                                                        </a>
                                                    )}
                                                    {member.socials.github && (
                                                        <a
                                                            href={member.socials.github}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label={`${member.name} GitHub`}
                                                            className="p-2 rounded-xl text-slate-400 hover:text-[#00A878] hover:bg-emerald-50 transition-all cursor-pointer"
                                                        >
                                                            <Github size={18} />
                                                        </a>
                                                    )}
                                                    {member.socials.email && (
                                                        <a
                                                            href={member.socials.email}
                                                            aria-label={`Email ${member.name}`}
                                                            className="p-2 rounded-xl text-slate-400 hover:text-[#00A878] hover:bg-emerald-50 transition-all cursor-pointer"
                                                        >
                                                            <Mail size={18} />
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="relative overflow-hidden rounded-[24px] bg-[#0B1121] text-white p-8 md:p-10 shadow-2xl border border-white/10 text-center">
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#00A878]/20 to-[#00A878]/0 blur-3xl" />
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-gradient-to-tr from-blue-500/15 to-purple-500/0 blur-3xl" />
                            <div className="relative z-10">
                                <h3 className="text-[28px] md:text-[32px] font-[800] leading-tight tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                    Join Pakistan's Growing Sports Business Community
                                </h3>
                                <p className="text-[16px] text-slate-400 font-medium leading-relaxed mb-8 w-full max-w-2xl mx-auto text-center">
                                    Whether you're a manufacturer looking to expand your reach or a wholesaler searching for trusted suppliers, GearUp provides the tools, connections, and confidence you need to grow your business. Together, we're building a stronger, more connected future for Pakistan's sports industry.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00A878] to-[#009166] text-white rounded-[16px] font-bold text-[16px] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,168,120,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(0,168,120,0.6)] hover:-translate-y-1"
                                    >
                                        Create Free Account
                                        <ArrowRight size={18} />
                                    </Link>
                                    <Link
                                        href="/contact"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-slate-300 rounded-[16px] font-bold text-[16px] hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md"
                                    >
                                        Contact Us
                                    </Link>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default About;
