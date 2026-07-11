/** Genera un QR SVG determinístico (no escaneable, solo visual) a partir de un seed. */
export function generateFakeQrSvg(seed: string): string {
  const size = 21
  const cells: boolean[] = []
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  for (let i = 0; i < size * size; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    cells.push((h >>> 16) % 3 !== 0)
  }
  // Esquinas de posicionamiento estilo QR real, para que sea reconocible a simple vista.
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const on = x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)
        cells[(oy + y) * size + (ox + x)] = on
      }
    }
  }
  finder(0, 0)
  finder(size - 7, 0)
  finder(0, size - 7)

  const cellSize = 8
  const rects: string[] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (cells[y * size + x]) {
        rects.push(`<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#111"/>`)
      }
    }
  }
  const total = size * cellSize
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}"><rect width="${total}" height="${total}" fill="#fff"/>${rects.join('')}</svg>`
}
