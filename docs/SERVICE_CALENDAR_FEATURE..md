Basado en la grabación y la conversación con el Product Owner (Vaughn Bailey), he elaborado un **Plan de Desarrollo Funcional** detallado para el módulo "Service Calendar".

El objetivo principal es transformar la página de una maqueta visual (UI) a una herramienta funcional que permita gestionar, visualizar y exportar el historial de mantenimiento de la flota.

Aquí tienes el desglose completo de tareas:

---

### 1. Modificaciones de UI/UX (Interfaz)

*   **Renombrar Botón Principal:**
    *   Cambiar el texto del botón de "New Service" a **"New Event"**.
    *   *Razón:* El PO explicó que no todo es un servicio programado; a veces son reparaciones imprevistas (como un cambio de batería) y "Event" abarca ambos casos.
*   **Formulario de "New Event" (Modal/Página):**
    *   Al hacer clic en "New Event", debe abrirse un formulario con los siguientes campos y comportamientos:
        1.  **Selección de Vehículo (Dropdown):** Lista de vehículos de la base de datos.
        2.  **Autocompletado:** Al seleccionar el vehículo, deben llenarse automáticamente:
            *   Conductor asignado.
            *   Marca y Modelo.
        3.  **Kilometraje (Mileage):** Input manual para registrar el kilometraje al momento del servicio.
        4.  **Fecha del Servicio:** Input de fecha (puede ser hoy o una fecha pasada).
        5.  **Próxima Fecha de Servicio (Future Date):** Input de fecha para programar el siguiente mantenimiento.
        6.  **Tipo de Evento:** Selección entre "Mantenimiento Programado" o "Reparación/Incidente" (ej. inspección de frenos, batería baja).
        7.  **Ubicación (Location):** Campo de texto. **Importante:** El PO especificó que este campo debe ser *opcional*.
    *   **Acción Final:** Botón "Sync to Calendar" (Guardar).

### 2. Lógica del Calendario (Frontend)

*   **Visualización:**
    *   El calendario debe renderizar los eventos guardados en la base de datos.
    *   Debe diferenciar visualmente (quizás por colores o iconos) entre un mantenimiento preventivo y una reparación correctiva.
*   **Interacción:**
    *   Al hacer clic en un evento del calendario, debe mostrar un resumen rápido (pop-up) o llevar al detalle del evento.

### 3. Historial de Servicios (Tabla Inferior)

*   **Vista Detallada (Botón "View"):**
    *   En la lista de vehículos o en la tabla inferior, al hacer clic en "View", se debe desplegar el **Historial de Servicios** específico de ese vehículo.
*   **Columnas Requeridas en el Historial:**
    1.  **Item/Servicio:** Qué se hizo (ej. "Cambio de Aceite", "Reemplazo de Batería").
    2.  **Fecha:** Cuándo se realizó.
    3.  **Kilometraje:** Kilometraje registrado en ese evento.
    4.  **Ubicación:** Dónde se hizo (recordar que es opcional, si está vacío mostrar "-").

### 4. Funcionalidad de Exportación

*   **Botón "Export":**
    *   Debe permitir descargar el historial de servicios que se está visualizando actualmente.
    *   Formato sugerido: CSV o PDF (similar a como funciona el "General Fleet Overview" que mencionó el PO).
    *   Debe incluir todos los detalles visibles en la tabla de historial.

---

### Resumen del Flujo de Usuario (User Flow)

1.  El usuario entra a **Service Calendar**.
2.  Hace clic en **"New Event"**.
3.  Selecciona el coche (Toyota Corolla). El sistema rellena automáticamente que lo conduce "Juan Pérez".
4.  El usuario ingresa que se cambió la batería (imprevisto), pone la fecha de ayer, el kilometraje actual y deja la ubicación en blanco.
5.  Hace clic en **"Sync to Calendar"**.
6.  El evento aparece en el calendario visual.
7.  El usuario baja a la tabla, busca el Toyota Corolla, da clic en **"View"**.
8.  Ve una tabla con el cambio de batería de ayer y los cambios de aceite anteriores.
9.  Hace clic en **"Export"** para bajar ese reporte y enviarlo.

