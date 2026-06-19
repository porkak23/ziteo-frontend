const fs = require('fs');

function replaceFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(({ search, replace }) => {
    content = content.replace(search, replace);
  });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

replaceFile('ziteo-frontend/src/features/auth/services/authService.ts', [
  { search: /const payload: Record<string, unknown> = /g, replace: 'const payload: any = ' }
]);

replaceFile('ziteo-frontend/src/features/maestro/components/MaestroOnboardingWizard.tsx', [
  { search: /const updates: Record<string, unknown> = /g, replace: 'const updates: any = ' }
]);
