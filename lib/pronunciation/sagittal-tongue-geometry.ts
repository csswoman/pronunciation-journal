import type { TonguePosition } from "@/lib/pronunciation/articulation-guide-data";

export interface TongueGeometry {
  path: string;
  contactX: number;
  contactY: number;
  label: string;
}

/** Anatomical tongue shape (dorsum, blade, tip) for the sagittal diagram. */
export function getTongueGeometry(position: TonguePosition): TongueGeometry {
  switch (position) {
    case "high-front":
      return {
        path: "M 48,125 C 60,118 78,82 105,62 C 122,50 140,55 146,68 C 142,88 126,114 105,124 C 85,128 58,128 48,125 Z",
        contactX: 130,
        contactY: 54,
        label: "Lengua arriba y adelante",
      };
    case "mid-front":
      return {
        path: "M 48,125 C 60,118 78,92 105,76 C 122,66 138,72 144,82 C 140,98 126,116 105,125 C 85,128 58,128 48,125 Z",
        contactX: 125,
        contactY: 70,
        label: "Lengua media frontal",
      };
    case "low-front":
      return {
        path: "M 48,128 C 60,122 78,105 105,98 C 122,94 138,98 144,106 C 138,118 126,124 105,128 C 85,130 58,130 48,128 Z",
        contactX: 120,
        contactY: 96,
        label: "Lengua baja y plana",
      };
    case "high-back":
      return {
        path: "M 48,125 C 58,102 74,58 96,62 C 114,66 128,88 138,98 C 128,112 114,122 96,125 C 76,128 58,128 48,125 Z",
        contactX: 92,
        contactY: 60,
        label: "Dorso elevado atrás",
      };
    case "mid-back":
    case "low-back":
      return {
        path: "M 48,126 C 58,110 74,80 96,82 C 114,86 128,100 138,108 C 128,118 114,124 96,126 C 76,128 58,128 48,126 Z",
        contactX: 96,
        contactY: 82,
        label: "Lengua retraída atrás",
      };
    case "tip-between-teeth":
      return {
        path: "M 48,125 C 65,120 90,95 115,88 C 135,84 154,75 168,76 C 156,92 135,112 110,122 C 85,128 60,128 48,125 Z",
        contactX: 164,
        contactY: 74,
        label: "Punta entre dientes",
      };
    case "tip-on-ridge":
      return {
        path: "M 48,125 C 65,120 90,95 118,85 C 136,78 146,55 151,56 C 144,82 128,112 105,122 C 80,128 60,128 48,125 Z",
        contactX: 150,
        contactY: 54,
        label: "Contacto en encía superior",
      };
    case "blade-on-palate":
      return {
        path: "M 48,125 C 65,115 90,82 118,66 C 136,60 148,65 152,75 C 142,95 128,116 105,124 C 80,128 60,128 48,125 Z",
        contactX: 136,
        contactY: 64,
        label: "Lámina al paladar",
      };
    case "back-on-velum":
      return {
        path: "M 48,125 C 58,95 76,52 92,54 C 114,60 128,90 138,100 C 128,114 114,122 96,125 C 76,128 58,128 48,125 Z",
        contactX: 88,
        contactY: 52,
        label: "Cierre en paladar blando",
      };
    case "retroflex-curl":
      return {
        path: "M 48,125 C 65,120 90,92 115,86 C 128,82 138,68 134,58 C 124,66 118,92 98,116 C 78,124 60,126 48,125 Z",
        contactX: 132,
        contactY: 58,
        label: "Punta curvada hacia atrás",
      };
    default:
      return {
        path: "M 48,125 C 65,120 90,98 114,94 C 132,90 142,96 146,102 C 138,115 125,122 105,125 C 80,128 60,128 48,125 Z",
        contactX: 115,
        contactY: 92,
        label: "Lengua relajada al centro",
      };
  }
}
