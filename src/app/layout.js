import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";

export const metadata = {
  title: "СПК коллектор сбора данных",
  description: "Приложение для просмотра журнала звонков голосовых оповещений Zabbix",
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
