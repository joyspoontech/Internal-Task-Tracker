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
                            <div className="w-7 h-7 rounded-lg bg-[var(--cta)] flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <Link href="/dashboard" className="text-base font-bold text-[var(--primary)] tracking-tight hover:opacity-80 transition-opacity">
                                Follow-Up Tracker
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 text-sm">
                                <span className="font-medium text-[var(--primary)]">{profile?.full_name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[profile?.role || ''] || 'bg-slate-100 text-slate-600'}`}>
                                    {profile?.role}
                                </span>
                                {profile?.department && (
                                    <span className="text-xs text-slate-400">· {profile.department}</span>
                                )}
                            </div>

                            <div className="w-px h-5 bg-slate-200" />

                            <form action={signout}>
                                <button type="submit" className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded hover:bg-slate-50">
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
