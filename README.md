# DispatchManager Frontend

**Interfaz web moderna para gestión de órdenes de despacho con reportes en tiempo real**

## 🚀 Stack Técnico

- **Angular 19** - Framework frontend
- **TypeScript 5.x** - Lenguaje tipado
- **Angular Material** - Componentes UI
- **SCSS** - Preprocesador CSS
- **RxJS** - Programación reactiva
- **Chart.js** - Gráficos y visualizaciones
- **SheetJS** - Exportación a Excel
- **Standalone Components** - Arquitectura moderna

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── core/                    # Servicios singleton, guards, interceptors
│   ├── shared/                  # Componentes, pipes, directivas reutilizables
│   ├── features/                # Módulos de funcionalidad
│   │   ├── orders/             # Gestión de órdenes
│   │   ├── customers/          # Gestión de clientes
│   │   ├── reports/            # Reportes y analytics
│   │   └── dashboard/          # Panel principal
│   ├── layout/                 # Componentes de layout
│   └── models/                 # Interfaces y tipos TypeScript
├── assets/                     # Recursos estáticos
├── environments/               # Configuraciones por ambiente
└── styles/                     # Estilos globales y themes
```

## ⚙️ Configuración Inicial

### 1. Prerrequisitos
```bash
# Node.js 22+ y npm
node --version  # >= 22.x.x
npm --version   # >= 10.9.x

# Angular CLI
npm install -g @angular/cli@19
```

### 2. Instalación y configuración
```bash
git clone https://github.com/alonsodev/dispatch-manager-frontend.git
cd dispatch-manager-frontend
npm install
```

### 3. Variables de entorno
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://pruebatecnica11.azurewebsites.net/api',
  cacheTimeout: 300000, // 5 minutos
  enableDebugLogs: true
};
```

### 4. Ejecutar aplicación
```bash
# Desarrollo
ng serve
# Aplicación disponible en: http://localhost:4200

# Producción
ng build --prod
ng serve --prod
```

## 🎨 Sistema de Diseño

### Paleta de Colores
```scss
$primary: #1976d2;    // Azul principal
$accent: #ff4081;     // Rosa acento
$warn: #f44336;       // Rojo advertencias
$success: #4caf50;    // Verde éxito
$background: #fafafa; // Fondo claro
```

### Principios de Diseño (Jonathan Ive)
- **Minimalismo**: Espacios generosos (p-4, p-6)
- **Tipografía clara**: Roboto, tamaños consistentes
- **Cards**: Esquinas suaves (rounded-2xl)
- **Sombras sutiles**: Elevación progresiva
- **Animaciones fluidas**: Transiciones de 200-300ms

## 🧩 Componentes Principales

### Layout
```typescript
// MainLayoutComponent - Estructura principal
// HeaderComponent - Barra superior con navegación
// SidenavComponent - Menú lateral colapsible
// FooterComponent - Información básica
```

### Features
```typescript
// OrderFormComponent - Creación/edición de órdenes
// OrderListComponent - Listado con filtros y paginación
// CustomerSelectorComponent - Selector de clientes
// ReportDashboardComponent - Dashboard de reportes
// ExcelExportComponent - Descarga de reportes
```

### Shared
```typescript
// LoadingComponent - Indicador de carga
// ConfirmDialogComponent - Confirmaciones
// NotificationService - Toast notifications
// CacheService - Gestión de caché
```

## 📊 Funcionalidades

### Gestión de Órdenes
- **Formulario reactivo** con validaciones en tiempo real
- **Selector de coordenadas** con mapa interactivo
- **Cálculo automático** de distancia y costo
- **Validaciones**: distancia (1-1000 km), campos obligatorios

### Reportes y Analytics
- **Dashboard** con métricas clave
- **Gráficos interactivos** por intervalos de distancia
- **Filtros dinámicos** por cliente y fechas
- **Exportación a Excel** con formato personalizado

### UX/UI Optimizada
- **Responsive design** para móviles y desktop
- **Loading states** en todas las operaciones
- **Error handling** con mensajes claros
- **Optimistic updates** para mejor percepción

## 🔧 Servicios Core

### ApiService
```typescript
// Wrapper para HTTP client con interceptors
// Manejo automático de errores
// Headers de autenticación
// Retry logic para requests fallidos
```

### CacheService
```typescript
// Cache en memoria para datos frecuentes
// TTL configurable por tipo de dato
// Invalidación manual y automática
// Estrategias: cache-first, network-first
```

### NotificationService
```typescript
// Toast notifications con Material Snackbar
// Tipos: success, error, warning, info
// Auto-dismiss configurable
// Queue de notificaciones
```

## 🚀 Build y Deploy

### Build para producción
```bash
# Optimización completa
ng build --prod

# Analizar bundle size
ng build --prod --source-map
npx webpack-bundle-analyzer dist/dispatch-manager-web/main.js
```

### Deploy automático
```bash
# Azure Static Web Apps
ng add @azure/static-web-apps-cli
swa deploy

# Netlify
ng build --prod
npx netlify deploy --prod --dir=dist/dispatch-manager-web
```

### Optimizaciones
- **Lazy loading** en módulos secundarios
- **OnPush** change detection en componentes
- **Preloading** strategy para rutas críticas
- **Service Worker** para cache de assets

## 🔒 Seguridad

### Guards y Interceptors
```typescript
// AuthGuard - Protección de rutas
// RoleGuard - Autorización por roles
// TokenInterceptor - JWT automático
// ErrorInterceptor - Manejo global de errores
```

### Validaciones Frontend
- **Input sanitization** contra XSS
- **CSRF protection** en formularios
- **Content Security Policy** headers
- **Rate limiting** visual para UX

### Optimizaciones implementadas
- **Tree shaking** automático
- **Code splitting** por rutas
- **Image lazy loading** con Angular 14+
- **Virtual scrolling** para listas grandes

## 🛠️ Scripts Útiles

```bash
# Desarrollo
npm start              # ng serve
npm run build          # ng build
npm run test           # ng test
npm run lint           # ng lint
npm run e2e            # ng e2e

# Análisis
npm run analyze        # bundle analyzer
npm run lighthouse     # performance audit
```

## 🔄 Integración con Backend

### API Client
```typescript
// BaseService - Configuración común HTTP
// Interceptors automáticos para auth y errors
// Retry logic con exponential backoff
// Request/Response transformation
```

### Estado Global
```typescript
// Servicios singleton para datos compartidos
// BehaviorSubjects para estado reactivo
// Local storage para persistencia
// Memory cache para performance
```