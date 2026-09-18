import './globals.css'; import type { Metadata } from 'next';
export const metadata: Metadata={title:'TTQ Attack Planner',description:'Attack planner for Travian Tournament Qualification Europe'};
export default function RootLayout({children}:{children:React.ReactNode}){return <>{children}</>}
