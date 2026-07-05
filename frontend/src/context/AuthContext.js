"use client";



import { getApiBaseUrl } from '@/lib/api';

import { clearStoredSession, getStoredToken, isValidJwtFormat } from '@/lib/authToken';



import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

import { flushSync } from 'react-dom';



const AuthContext = createContext();



export const useAuth = () => {

    const context = useContext(AuthContext);

    if (!context) {

        throw new Error('useAuth must be used within an AuthProvider');

    }

    return context;

};



export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);



    const clearSession = useCallback(() => {

        clearStoredSession();

        setUser(null);

    }, []);



    const refreshSession = useCallback(async () => {

        const token = getStoredToken();



        if (!token) {

            const storedUser = localStorage.getItem('gearup_user');

            if (storedUser) {

                clearSession();

            }

            return false;

        }



        try {

            const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {

                headers: {

                    Authorization: `Bearer ${token}`,

                },

            });

            const data = await res.json();



            if (res.ok && data.success && data.data) {

                setUser(data.data);

                localStorage.setItem('gearup_user', JSON.stringify(data.data));

                return true;

            }



            if (res.status === 401) {

                clearSession();

            }

        } catch (error) {

            console.error('Session restoration error:', error);

        }



        return false;

    }, [clearSession]);



    useEffect(() => {

        const initAuth = async () => {

            const storedUser = localStorage.getItem('gearup_user');

            const token = localStorage.getItem('token');



            if (storedUser && isValidJwtFormat(token)) {

                try {

                    setUser(JSON.parse(storedUser));

                } catch (error) {

                    clearSession();

                }

            } else if (storedUser && !isValidJwtFormat(token)) {

                clearSession();

            }



            await refreshSession();

            setLoading(false);

        };



        initAuth();

    }, [clearSession, refreshSession]);



    useEffect(() => {

        const handleFocus = () => {

            refreshSession();

        };



        window.addEventListener('focus', handleFocus);

        return () => window.removeEventListener('focus', handleFocus);

    }, [refreshSession]);



    const login = (userData, token) => {

        if (typeof window !== 'undefined') {

            localStorage.setItem('gearup_user', JSON.stringify(userData));

            if (isValidJwtFormat(token)) {

                localStorage.setItem('token', token.trim());

            } else {

                localStorage.removeItem('token');

            }

        }

        flushSync(() => {

            setUser(userData);

        });

    };



    const logout = async () => {

        try {

            await fetch(`${getApiBaseUrl()}/api/auth/logout`);

        } catch (error) {

            console.error('Logout failed:', error);

        }

        clearSession();

    };



    const updateUser = (userData) => {

        setUser(userData);

        localStorage.setItem('gearup_user', JSON.stringify(userData));

    };



    const updateVerificationStatus = (status, additionalData = {}) => {

        const updatedUser = {

            ...user,

            verificationStatus: status,

            verified: status === 'approved' || status === 'verified',

            ...additionalData

        };

        updateUser(updatedUser);

    };



    const value = {

        user,

        login,

        logout,

        updateUser,

        updateVerificationStatus,

        refreshSession,

        loading,

        isAuthenticated: !!user && !!getStoredToken(),

        isReadOnlyMode: !!user?.isBlocked && user?.role !== 'admin',

        blockReason: user?.isBlocked ? (user?.blockReason || '') : '',

    };



    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

};


