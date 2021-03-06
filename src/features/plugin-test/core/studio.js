const spawn = require('child_process').spawn;
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

const output = [];
let seed = 0;
const emit = _.debounce(io => {
  let toClient = output.length > 300 ? output.slice(-300) : output;
  toClient = toClient.map(text => {
    seed++;
    seed %= 1000000;
    return { text, key: `test_${seed}` };
  });
  io.emit('output', toClient); // max to 300 lines flush to client
  output.length = 0;
}, 100);

function debouncedOutput(text, io) {
  output.push(text);
  emit(io);
}

let running = null;
function config(server, app, args) {
  const io = args.io;

  const onData = (chunk, name) => {
    chunk
      .toString('utf8')
      .split('\n')
      .forEach(s => debouncedOutput(s, io));
  };
  app.post('/api/run-test', function(req, res) {
    if (running) {
      res.send({ alreadyRunning: true });
      res.end();
      return;
    }
    const args = req.body.args;//.map(file => (file.startsWith('-') ? file : `"${file}"`));
    if (args.indexOf('--no-watch') < 0) args.push('--no-watch');

    if (running) {
      res.send('already-running');
      res.end();
      return;
    }
    const tmpDir = rekit.core.paths.map('tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(
      npmCmd,
      ['run', 'test', '--', '--colors', '--json', '--outputFile=tmp/testOutput.json'].concat(args),
      {
        cwd: rekit.core.paths.getProjectRoot(),
        stdio: 'pipe',
      }
    );
    running = child;

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', () => {
      const outputFile = path.join(tmpDir, 'testOutput.json');
      io.emit('run-test-status', {
        type: 'exit',
        projectRoot: rekit.core.paths.getProjectRoot(),
        data: fs.existsSync(outputFile) ? fs.readJsonSync(outputFile, { throw: false }) : null,
      });
      running = null;
    });

    res.send(JSON.stringify({ running: true }));
    res.end();
  });

  app.post('/api/stop-run-test', (req, res) => {
    if (running) {
      running.kill();
      running = null;
    }
    res.send(JSON.stringify({ running: false }));
    res.end();
  });
}

module.exports = {
  config,
  getRunning() {
    // const running = {};
    // Object.keys(processes).forEach(k => (running[k] = true));
    return running;
  },
};
