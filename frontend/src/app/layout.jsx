import './globals.css';
import Providers from '../components/Providers';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'BudSprzęt – wypożyczalnia sprzętu budowlanego',
  description: 'Rezerwuj sprzęt budowlany online: młoty, zagęszczarki, agregaty, rusztowania.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏗️</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
