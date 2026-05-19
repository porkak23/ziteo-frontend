#!/bin/bash
# Prerrequisitos: npm install -g @bubblewrap/cli, Java JDK 11+, Android SDK
# Uso: bash scripts/build-twa.sh

set -e

echo "Verificando prerrequisitos..."

if ! command -v java &> /dev/null; then
  echo "ERROR: Java JDK 11+ no encontrado. Instalar desde https://adoptium.net/"
  exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 11 ] 2>/dev/null; then
  echo "ERROR: Se requiere Java 11+. Version actual: $JAVA_VERSION"
  exit 1
fi

if [ ! -f "./android.keystore" ]; then
  echo ""
  echo "AVISO: No se encontro android.keystore."
  echo "Generarlo con:"
  echo "  keytool -genkey -v -keystore android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000"
  echo ""
  echo "Luego obtener el SHA256 con:"
  echo "  keytool -list -v -keystore android.keystore -alias android"
  echo "Y actualizar public/.well-known/assetlinks.json con el SHA256."
  echo ""
  exit 1
fi

if [ ! -f "./twa-manifest.json" ]; then
  echo "ERROR: twa-manifest.json no encontrado. Ejecutar desde la raiz de ziteo-frontend/."
  exit 1
fi

echo "Generando TWA con Bubblewrap..."
npx @bubblewrap/cli build --manifest ./twa-manifest.json

echo ""
echo "Build completado."
echo "AAB generado en: android/app/build/outputs/bundle/release/"
echo ""
echo "Siguiente paso: subir el .aab a Google Play Console"
echo "  https://play.google.com/console"
echo "  Package ID: bo.ziteo.app"
