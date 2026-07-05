import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { InactivityLogoutWrapper } from "@/components/InactivityLogoutWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({
  variable: "--font-app",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "GearUp | Pakistan's Premier B2B Sports Marketplace",
  description:
    "Connect with verified manufacturers, streamline bulk ordering, and transform your sports goods business with GearUp.",
  keywords: "sports manufacturing, B2B marketplace, cricket, football, Pakistan, GearUp",
};

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function RootLayout({ children }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '373271456084-6flk0m1dvv2j8fipt5m787vt5jg8cv2c.apps.googleusercontent.com';
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <GoogleOAuthProvider clientId={clientId}>
          <ErrorBoundary>
            <AuthProvider>
              <InactivityLogoutWrapper>
                {children}
              </InactivityLogoutWrapper>
            </AuthProvider>
          </ErrorBoundary>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
