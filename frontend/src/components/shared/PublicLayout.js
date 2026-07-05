import React from 'react';
import Navigation from './Navigation';
import Footer from './Footer';

const PublicLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-grow pt-20"> {/* Added pt-20 for fixed nav */}
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;
