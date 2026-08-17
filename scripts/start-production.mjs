import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {assertRuntimeEnvironment} from './runtime-env.mjs';

assertRuntimeEnvironment();

const dockerServer = 'server.js';
const command = existsSync(dockerServer) ? dockerServer : 'node_modules/next/dist/bin/next';
const args = existsSync(dockerServer) ? [] : ['start'];
const child = spawn(process.execPath, [command, ...args], {
  env: {...process.env, NODE_ENV: 'production'},
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
