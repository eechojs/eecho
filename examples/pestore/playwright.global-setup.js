const { spawn } = require('node:child_process');
const { once } = require('node:events');
const path = require('node:path');

const currentDirectory = __dirname;
const serverDirectory = path.resolve(currentDirectory, 'apps/server');
const clientDirectory = path.resolve(currentDirectory, 'apps/client');
const astroCli = path.resolve(currentDirectory, '../../node_modules/astro/astro.js');

const startupTimeoutMs = 3 * 60 * 1000;

const wait = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs));

function startNode(args, cwd) {
  return spawn(process.execPath, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  });
}

async function waitForUrl(url, childProcess) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < startupTimeoutMs) {
    if (childProcess.exitCode !== null) {
      throw new Error(`Process exited before ${url} became ready.`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The process is still starting.
    }

    await wait(250);
  }

  throw new Error(`Timed out waiting for ${url}.`);
}

async function stopProcess(childProcess) {
  if (childProcess.exitCode !== null) {
    return;
  }

  childProcess.kill();
  await Promise.race([
    once(childProcess, 'exit'),
    wait(5_000),
  ]);

  if (childProcess.exitCode === null) {
    childProcess.kill('SIGKILL');
    await once(childProcess, 'exit');
  }
}

module.exports = async function globalSetup() {
  const serverProcess = startNode(['dist/main.js'], serverDirectory);
  const clientProcess = startNode([
    astroCli,
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '43210',
  ], clientDirectory);

  try {
    await Promise.all([
      waitForUrl('http://127.0.0.1:3100', serverProcess),
      waitForUrl('http://127.0.0.1:43210', clientProcess),
    ]);
  } catch (error) {
    await Promise.all([
      stopProcess(serverProcess),
      stopProcess(clientProcess),
    ]);
    throw error;
  }

  return async () => {
    await Promise.all([
      stopProcess(serverProcess),
      stopProcess(clientProcess),
    ]);
  };
};
