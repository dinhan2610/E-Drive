declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "jspdf-autotable" {
  import { jsPDF } from "jspdf";
  interface UserOptions {
    head?: any[][];
    body?: any[][];
    startY?: number;
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    styles?: any;
    columnStyles?: any;
    theme?: 'striped' | 'grid' | 'plain';
  }
  export default function autoTable(doc: jsPDF, options: UserOptions): void;
}


declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}

declare module "@fortawesome/fontawesome-free/css/all.css";
