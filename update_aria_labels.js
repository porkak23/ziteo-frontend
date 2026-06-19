const fs = require('fs');

function replaceFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
  });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

replaceFile('ziteo-frontend/src/features/settings/components/SettingsScreen.tsx', [
  { search: /className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container active:opacity-80 transition-opacity"/g, replace: 'className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container active:opacity-80 transition-opacity" aria-label="Cerrar"' }
]);

replaceFile('ziteo-frontend/src/features/perfil/components/PerfilScreen.tsx', [
  { search: /className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container active:opacity-70"/g, replace: 'className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container active:opacity-70" aria-label="Cerrar"' },
  { search: /className="absolute -top-3 -right-3 w-9 h-9 bg-surface rounded-full flex items-center justify-center shadow-lg active:opacity-70"/g, replace: 'className="absolute -top-3 -right-3 w-9 h-9 bg-surface rounded-full flex items-center justify-center shadow-lg active:opacity-70" aria-label="Cerrar"' }
]);

replaceFile('ziteo-frontend/src/features/proveedor/components/InventarioScreen.tsx', [
  { search: /className="w-10 h-10 flex items-center justify-center rounded-full"/g, replace: 'className="w-10 h-10 flex items-center justify-center rounded-full" aria-label="Cerrar"' }
]);

replaceFile('ziteo-frontend/src/features/licitaciones/components/NuevaLicitacionForm.tsx', [
  { search: /className="text-on-surface-variant p-1"/g, replace: 'className="text-on-surface-variant p-1" aria-label="Cerrar"' }
]);

replaceFile('ziteo-frontend/src/features/licitaciones/components/LicitacionFeed.tsx', [
  { search: /className="text-on-surface-variant p-1"/g, replace: 'className="text-on-surface-variant p-1" aria-label="Cerrar"' }
]);

replaceFile('ziteo-frontend/src/features/licitaciones/components/SolicitudesProveedorFeed.tsx', [
  { search: /className="text-on-surface-variant p-1"/g, replace: 'className="text-on-surface-variant p-1" aria-label="Cerrar"' }
]);

replaceFile('ziteo-frontend/src/features/tienda/components/FilterSheet.tsx', [
  { search: /className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"/g, replace: 'className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors" aria-label="Cerrar"' }
]);

replaceFile('ziteo-frontend/src/features/tienda/components/TiendaScreen.tsx', [
  { search: /className="shrink-0"/g, replace: 'className="shrink-0" aria-label="Limpiar"' },
  { search: /className="shrink-0 flex items-center gap-1 font-label text-xs text-primary font-semibold"/g, replace: 'className="shrink-0 flex items-center gap-1 font-label text-xs text-primary font-semibold" aria-label="Ver todos los proveedores"' }
]);

replaceFile('ziteo-frontend/src/features/maestro/components/MaestroProfileScreen.tsx', [
  { search: /className="text-on-surface-variant active:opacity-70 px-2"/g, replace: 'className="text-on-surface-variant active:opacity-70 px-2" aria-label="Cerrar"' }
]);

replaceFile('ziteo-frontend/src/shared/components/ReviewModal.tsx', [
  { search: /className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container\/80 transition-colors"/g, replace: 'className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container/80 transition-colors" aria-label="Cerrar"' }
]);

replaceFile('ziteo-frontend/src/shared/components/ReviewForm.tsx', [
  { search: /className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"/g, replace: 'className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors" aria-label="Cerrar"' }
]);

replaceFile('ziteo-frontend/src/shared/components/ChatScreen.tsx', [
  { search: /className="flex items-center justify-center w-11 h-11 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"/g, replace: 'className="flex items-center justify-center w-11 h-11 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors" aria-label="Cerrar"' }
]);

replaceFile('ziteo-frontend/src/shared/components/CuentaScreen.tsx', [
  { search: /onClick=\{\(\) => !savingPin && setShowPinModal\(false\)\}\n                style=\{\{\n                  width: 36, height: 36, borderRadius: '50%', border: 'none', background: Z.divider,\n                  display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',\n                  cursor: 'pointer', outline: 'none',\n                \}\}/g, replace: "onClick={() => !savingPin && setShowPinModal(false)}\n                style={{\n                  width: 36, height: 36, borderRadius: '50%', border: 'none', background: Z.divider,\n                  display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',\n                  cursor: 'pointer', outline: 'none',\n                }} aria-label=\"Cerrar\"" },
  { search: /onClick=\{\(\) => !savingCity && setShowCityModal\(false\)\}\n                style=\{\{\n                  width: 36, height: 36, borderRadius: '50%', border: 'none', background: Z.divider,\n                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none',\n                \}\}/g, replace: "onClick={() => !savingCity && setShowCityModal(false)}\n                style={{\n                  width: 36, height: 36, borderRadius: '50%', border: 'none', background: Z.divider,\n                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none',\n                }} aria-label=\"Cerrar\"" },
  { search: /onClick=\{\(\) => setLegalModal\(null\)\}\n                style=\{\{\n                  width: 36, height: 36, borderRadius: '50%', border: 'none', background: Z.divider,\n                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none',\n                \}\}/g, replace: "onClick={() => setLegalModal(null)}\n                style={{\n                  width: 36, height: 36, borderRadius: '50%', border: 'none', background: Z.divider,\n                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none',\n                }} aria-label=\"Cerrar\"" }
]);

replaceFile('ziteo-frontend/src/shared/components/InstallPWA.tsx', [
  { search: /className="text-on-surface-variant"/g, replace: 'className="text-on-surface-variant" aria-label="Cerrar"' }
]);
