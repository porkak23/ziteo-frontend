/**
 * Sandbox de simulación: solo activo en `npm run dev` con VITE_SIMULATION_MODE=true.
 * Ambas condiciones son expresiones literales que Vite pliega en build, por lo que
 * `vite build` produce `SIMULATION = false` y Rollup elimina el código muerto que
 * depende de esta constante (ver src/sandbox/).
 */
export const SIMULATION = import.meta.env.DEV && import.meta.env.VITE_SIMULATION_MODE === 'true'
