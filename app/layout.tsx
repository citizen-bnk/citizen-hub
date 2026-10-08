import type { Metadata,Viewport } from "next";
import './globals.css';
export const metadata:Metadata={title:{default:'Citizen Hub',template:'%s · Citizen Hub'},icons:{icon:'/brand/logo.webp'},description:'Citizen Bank board, investor and institutional workspace.',robots:{index:false,follow:false}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#08051b'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;}
