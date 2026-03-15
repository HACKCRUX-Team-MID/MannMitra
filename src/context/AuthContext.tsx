import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string; // 1-2 letter initials
    joinedAt: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Fetch initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                const mapUser = (su: any): User => ({
                    id: su.id,
                    name: su.user_metadata?.name || 'User',
                    email: su.email || '',
                    avatar: su.user_metadata?.avatar || 'U',
                    joinedAt: su.created_at,
                });
                setUser(mapUser(session.user));
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                const mapUser = (su: any): User => ({
                    id: su.id,
                    name: su.user_metadata?.name || 'User',
                    email: su.email || '',
                    avatar: su.user_metadata?.avatar || 'U',
                    joinedAt: su.created_at,
                });
                setUser(mapUser(session.user));
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signup = async (name: string, email: string, password: string) => {
        try {
            const initials = name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name.trim(),
                        avatar: initials,
                    }
                }
            });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
