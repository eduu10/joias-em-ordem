// Confere a pasta game/ contra os limites publicados do YouTube Playables: `npm run check`
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Uso: node tools/check.mjs [pasta do jogo]
const FOLDER = process.argv[2] ?? 'game';
const ROOT = fileURLToPath(new URL(`../${FOLDER}`, import.meta.url));
const MIB = 1024 * 1024;
const LIMITS = Object.freeze({
  totalBytes: 250 * MIB,
  initialBytesMust: 30 * MIB,
  initialBytesShould: 15 * MIB,
  fileBytesMust: 30 * MIB,
  fileBytesShould: 512 * 1024,
  fileCount: 8000,
});
const SDK_URL = 'https://www.youtube.com/game_api/v1';
const VALID_NAME = /^[A-Za-z0-9_.-]+$/;
const TEXT_FILE = /\.(html|js|css|json)$/;
const ABSOLUTE_REF = /(?:src|href)\s*=\s*["']\/(?!\/)|url\(\s*["']?\/(?!\/)|from\s+["']\/|import\(\s*["']\//;
const FORBIDDEN_API = /visibilitychange|document\.hidden|visibilityState/;

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }));
  return nested.flat();
};

const inspectFile = async (file) => {
  const name = relative(ROOT, file).replaceAll('\\', '/');
  const { size } = await stat(file);
  const errors = [];
  const warnings = [];
  if (!name.split('/').every((part) => VALID_NAME.test(part))) errors.push(`nome invalido: ${name}`);
  if (size >= LIMITS.fileBytesMust) errors.push(`arquivo acima de 30 MiB: ${name}`);
  else if (size >= LIMITS.fileBytesShould) warnings.push(`arquivo acima de 512 KiB: ${name}`);
  if (TEXT_FILE.test(name)) {
    const text = await readFile(file, 'utf8');
    if (ABSOLUTE_REF.test(text)) errors.push(`caminho absoluto em ${name} (use caminhos relativos)`);
    if (FORBIDDEN_API.test(text)) errors.push(`Page Visibility API em ${name} (use onPause/onResume do SDK)`);
  }
  return { name, size, errors, warnings };
};

const checkIndex = async () => {
  const html = await readFile(join(ROOT, 'index.html'), 'utf8').catch(() => null);
  if (html === null) return ['index.html nao encontrado na raiz da pasta do jogo'];
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map((match) => match[0]);
  if (!scripts.length || !scripts[0].includes(SDK_URL)) {
    return [`o primeiro <script> do index.html precisa ser o SDK (${SDK_URL})`];
  }
  return [];
};

const files = await Promise.all((await walk(ROOT)).map(inspectFile));
const total = files.reduce((sum, file) => sum + file.size, 0);
const errors = [...await checkIndex(), ...files.flatMap((file) => file.errors)];
const warnings = files.flatMap((file) => file.warnings);

if (files.length > LIMITS.fileCount) errors.push(`mais de ${LIMITS.fileCount} arquivos`);
if (total >= LIMITS.totalBytes) errors.push('pacote total acima de 250 MiB');
if (total >= LIMITS.initialBytesMust) warnings.push('pacote acima de 30 MiB: confira o tamanho do carregamento inicial');
else if (total >= LIMITS.initialBytesShould) warnings.push('pacote acima de 15 MiB: o ideal e carregar menos que isso ate o gameReady');

console.log(`${files.length} arquivos, ${(total / 1024).toFixed(1)} KiB no total`);
warnings.forEach((message) => console.log(`AVISO  ${message}`));
errors.forEach((message) => console.log(`ERRO   ${message}`));
console.log(errors.length ? 'Reprovado.' : 'Aprovado nos limites verificados.');
process.exit(errors.length ? 1 : 0);
