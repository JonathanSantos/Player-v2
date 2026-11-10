// Gera o index.html a partir de report/template.html, embutindo os arquivos
// reais do repositório. Assim o relatório nunca mostra um trecho desatualizado.
import { readFile, readdir, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const listJs = async (directory) => (await readdir(new URL(directory, root))).filter((name) => name.endsWith('.js')).map((name) => `${directory}${name}`);

const originalFiles = ['original/index.html', 'original/README.md'];
const newFiles = ['index.js', ...(await listJs('src/'))];
const demoFiles = ['demo/tune.js'];
const testFiles = await listJs('test/');

const sources = {};
for (const path of [...originalFiles, ...newFiles, ...demoFiles, ...testFiles]) sources[path] = await read(path);

const countLines = (text) => text.trim().split('\n').length;
const countTests = (paths) => paths.reduce((total, path) => total + (sources[path].match(/^test\(/gm) ?? []).length, 0);

// O componente de 2016: do `var Player` até o fim do prototype, sem as quatro instâncias de exemplo.
const originalScript = sources['original/index.html'].split('<script type="text/javascript">')[1].split('var player1')[0];

const values = {
  ORIGINAL_LINES: countLines(originalScript),
  NEW_LINES: newFiles.reduce((total, path) => total + countLines(sources[path]), 0),
  TEST_COUNT: countTests(testFiles),
};

// `<` escapado para que nenhum trecho de código feche a tag <script> por engano.
const embedded = `<script type="application/json" id="sources">${JSON.stringify(sources).replaceAll('<', '\\u003c')}</script>`;

const template = await read('report/template.html');
const html = template
  .replace('<!--SOURCES-->', () => embedded)
  .replace(/\{\{(\w+)\}\}/g, (match, name) => values[name] ?? match);

await writeFile(new URL('index.html', root), html);
console.log('index.html gerado', values);
