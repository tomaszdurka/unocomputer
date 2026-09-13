import { themeInitScript } from '@app/ui';
import './globals.css';

export const metadata = {
  title: 'UnoComputer',
  description: 'UnoComputer Dashboard - Workspaces and Runs'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  );
}
