import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  DoughnutController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

/**
 * Configuración global de Chart.js
 * Registra todos los componentes necesarios para el dashboard
 */
export function configureChartJS(): void {
  // Registrar scales (escalas)
  Chart.register(
    CategoryScale,    // Para el eje X con categorías
    LinearScale      // Para el eje Y con valores numéricos
  );

  // Registrar elements (elementos gráficos)
  Chart.register(
    BarElement,      // Barras para gráficos de barras
    ArcElement       // Arcos para gráficos de donut/pie
  );

  // Registrar controllers (controladores de tipos de gráfico)
  Chart.register(
    BarController,      // Controlador para gráficos de barras
    DoughnutController  // Controlador para gráficos de donut
  );

  // Registrar plugins (funcionalidades adicionales)
  Chart.register(
    Title,    // Títulos
    Tooltip,  // Tooltips
    Legend,   // Leyendas
    Filler    // Relleno de áreas
  );

  // Configuración global por defecto
  Chart.defaults.font.family = "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#64748b'; // Color de texto por defecto
  Chart.defaults.backgroundColor = 'rgba(59, 130, 246, 0.8)'; // Color de fondo por defecto
  Chart.defaults.borderColor = 'rgba(59, 130, 246, 1)'; // Color de borde por defecto

  // Configuraciones responsive por defecto
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;

  console.log('✅ Chart.js configurado correctamente con todos los componentes registrados');
}