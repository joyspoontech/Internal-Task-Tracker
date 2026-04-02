import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '@/app/login/actions'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const { data: profile } = await supabase
        .from('users')
        .select('full_name, role, department')
        .eq('id', user.id)
        .single()
    
    if (!profile) {
        return redirect('/signup/complete')
    }

    const roleColors: Record<string, string> = {
        'Founder': 'bg-amber-50 text-amber-700',
        'Manager': 'bg-blue-50 text-blue-700',
        'Employee': 'bg-emerald-50 text-emerald-700',
        'Admin': 'bg-purple-50 text-purple-700',
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[var(--cta)] flex items-center justify-center text-white font-bold text-sm">
                                ✓
                            </div>
                            <Link href="/dashboard" className="text-base font-bold text-[var(--primary)] tracking-tight hover:opacity-80 transition-opacity">
                                Follow-Up Tracker
                            </Link>
                            
                            {(profile?.role === 'Founder' || profile?.role === 'Admin') && (
                                <>
                                    <div className="w-px h-4 bg-slate-200 mx-2 hidden sm:block" />
                                    <Link 
                                        href="/dashboard/settings" 
                                        className="text-[13px] font-semibold text-slate-500 hover:text-[var(--cta)] transition-colors px-2 py-1 rounded-md hover:bg-slate-50 hidden sm:block"
                                    >
                                        Settings
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Profile Section */}
                            <div className="flex items-center gap-2 text-sm max-w-[140px] sm:max-w-none">
                                {/* Initials Avatar as Link */}
                                <Link href="/dashboard/profile" className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 hover:border-[var(--cta)] hover:text-[var(--cta)] transition-all active:scale-95">
                                    {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                </Link>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2 overflow-hidden">
                                    <Link href="/dashboard/profile" className="font-bold text-[var(--primary)] text-xs sm:text-sm truncate hover:text-[var(--cta)] transition-colors">
                                        {profile?.full_name}
                                    </Link>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-xs font-bold uppercase tracking-wider ${roleColors[profile?.role || ''] || 'bg-slate-100 text-slate-600'}`}>
                                            {profile?.role}
                                        </span>
                                        {profile?.department && (
                                            <span className="hidden lg:inline text-[10px] text-slate-400 font-medium">
                                                · {profile.department}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {(profile?.role === 'Founder' || profile?.role === 'Admin') && (
                                <Link 
                                    href="/dashboard/profile"
                                    className="hidden sm:block text-[10px] font-bold text-slate-400 hover:text-[var(--cta)] transition-colors uppercase tracking-widest px-2 py-1"
                                >
                                    Profile
                                </Link>
                            )}

                            <div className="w-px h-6 bg-slate-200" />

                            <form action={signout} className="shrink-0">
                                <button type="submit" className="text-[10px] sm:text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-100">
                                    Sign out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                {children}
            </main>

            <footer className="border-t border-slate-200/60 py-4">
                <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
                    Follow-Up Tracker · Joyspoon
                </div>
            </footer>
        </div>
    )
}
