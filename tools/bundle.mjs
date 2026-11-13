// Gera playable.zip com o conteudo de game/: `npm run bundle`
// Usa o tar do proprio Windows, que sabe escrever zip. O tar do Git Bash nao sabe.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = fileURLToPath(new URL('..', import.meta.url));
const OUTPUT = join(PROJECT, 'playable.zip');
const TAR = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe');
const ZIP_MAGIC = 'PK';

try {
  rmSync(OUTPUT, { force: true });
  const entries = readdirSync(join(PROJECT, 'game'));
  execFileSync(TAR, ['-a', '-c', '-f', OUTPUT, '-C', join(PROJECT, 'game'), ...entries], { stdio: 'inherit' });
  if (readFileSync(OUTPUT).subarray(0, 2).toString('latin1') !== ZIP_MAGIC) {
    throw new Error('o arquivo gerado nao e um zip valido');
  }
  console.log(`Pacote gerado em ${OUTPUT}`);
} catch (error) {
  console.error(`Falha ao gerar o pacote: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
