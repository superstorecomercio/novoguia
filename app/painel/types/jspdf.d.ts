declare module "jspdf" {
  export class jsPDF {
    constructor(orientation?: "p" | "portrait" | "l" | "landscape", unit?: string, format?: string | number[])

    text(text: string | string[], x: number, y: number, options?: any): jsPDF
    setFontSize(size: number): jsPDF
    setFont(fontName: string, fontStyle?: string): jsPDF
    setTextColor(r: number, g: number, b: number): jsPDF
    setDrawColor(r: number, g: number, b: number): jsPDF
    setFillColor(r: number, g: number, b: number): jsPDF
    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: "NONE" | "FAST" | "MEDIUM" | "SLOW",
      rotation?: number,
    ): jsPDF
    line(x1: number, y1: number, x2: number, y2: number): jsPDF
    rect(x: number, y: number, width: number, height: number, style?: "S" | "F" | "FD"): jsPDF
    addPage(format?: string | number[], orientation?: "p" | "portrait" | "l" | "landscape"): jsPDF
    splitTextToSize(text: string, maxWidth: number): string[]
    output(type: "blob"): Blob
    output(type: "arraybuffer"): ArrayBuffer
    output(type: "datauristring" | "dataurlstring"): string
    output(type: string): any
    save(filename: string): void

    internal: {
      pageSize: {
        getWidth(): number
        getHeight(): number
      }
    }
  }
}
