import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";

export const metadata = {
  title: "Classificator",
  description: "Приложение для планирования метрик приборов",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
