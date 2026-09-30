// Planned structure:
// <OfflineCapabilitiesList>
//   <CapabilityGroup /> × 3  (sin conexión · si lo descargaste · necesita internet)
// </OfflineCapabilitiesList>

interface CapabilityGroupProps {
  title: string;
  mark: string;
  markClassName: string;
  items: readonly string[];
}

const GROUPS: readonly CapabilityGroupProps[] = [
  {
    title: "Disponible sin conexión",
    mark: "✓",
    markClassName: "text-primary",
    items: [
      "Tu plan diario con lo que ya está en este dispositivo",
      "Registro local de progreso (se sincroniza al volver)",
    ],
  },
  {
    title: "Disponible si lo descargaste",
    mark: "↓",
    markClassName: "text-primary",
    items: [
      "Lecciones guardadas una por una y sus audios",
      "Paquete de tu nivel: Essential Words, gramática y audios",
      "Ejercicios del Coach guardados",
    ],
  },
  {
    title: "Necesita internet",
    mark: "✗",
    markClassName: "text-fg-subtle",
    items: [
      "Correcciones y ejercicios nuevos con IA",
      "Iniciar sesión y sincronizar con la nube",
      "Descargar lecciones o paquetes nuevos",
      "Voz sintética: depende de tu navegador y no forma parte del paquete",
    ],
  },
];

function CapabilityGroup({ title, mark, markClassName, items }: CapabilityGroupProps) {
  return (
    <div className="rounded-xl border border-line bg-surface-raised p-4">
      <p className="mb-2 text-body-sm font-medium text-fg">{title}</p>
      <ul className="space-y-1.5 text-caption text-fg-muted">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-1.5">
            <span aria-hidden="true" className={markClassName}>{mark}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OfflineCapabilitiesList() {
  return (
    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {GROUPS.map((group) => (
        <CapabilityGroup key={group.title} {...group} />
      ))}
    </div>
  );
}
