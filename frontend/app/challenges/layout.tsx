import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { ReactNode } from 'react';

export default function ChallengesLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
} 