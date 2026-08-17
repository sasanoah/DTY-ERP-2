import type {ReactNode} from 'react';
import './globals.css';
import {Sidebar} from '@/components/Sidebar';
export const metadata={title:'DTY ERP',description:'نظام إدارة مصنع DTY'};
export default function RootLayout({children}:{children:ReactNode}){
 return <html lang="ar" dir="rtl"><body><div className="app"><Sidebar/><main className="main">{children}</main></div></body></html>
}
