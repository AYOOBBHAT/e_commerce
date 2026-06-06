import { Wrench } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MaintenancePage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-10">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/30 shadow-[0_18px_45px_rgba(15,23,42,0.9)]">
            <Wrench className="h-14 w-14 sm:h-16 sm:w-16 text-amber-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
            Under Maintenance Mode
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            We&apos;re polishing a few things behind the scenes. Please try again in a little while.
          </p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-700/70 text-left space-y-3">
          <p className="text-sm text-slate-200">
            The website is currently under maintenance so everything looks and feels perfect when you return.
          </p>
          <p className="text-xs text-slate-400">
            If you&apos;re an administrator, you can still access the admin panel from the button below.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto border-slate-600/80 bg-slate-900/60 text-slate-50 hover:bg-slate-800 hover:border-slate-500"
          >
            <Link href="/login">Admin login</Link>
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto bg-amber-400 text-slate-950 hover:bg-amber-300 font-semibold shadow-[0_14px_30px_rgba(251,191,36,0.35)]"
          >
            <Link href="/">Try again</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

