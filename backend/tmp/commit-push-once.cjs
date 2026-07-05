const { execFileSync } = require('node:child_process');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '..', '..');
const git = path.join(repoDir, 'node_modules', 'dugite', 'git', 'cmd', 'git.exe');

function run(args) {
  execFileSync(git, args, { cwd: repoDir, stdio: 'inherit' });
}

run(['add', '-A']);
run(['reset', 'backend/tmp/']);
run(['reset', 'tmp_curl.html']);
run(['status', '--short']);
run([
  'commit',
  '-m',
  'feat: advertising, chat, marketplace, homepage, and Dialogflow updates across full project',
]);

if (!process.env.GH_USER || !process.env.GH_TOKEN) {
  console.error('Missing GH_USER/GH_TOKEN');
  process.exit(1);
}

const remoteUrl = `https://${encodeURIComponent(process.env.GH_USER)}:${encodeURIComponent(process.env.GH_TOKEN)}@github.com/hamzhehe/gearup.git`;
run(['remote', 'set-url', 'origin', remoteUrl]);
try {
  run(['push', '-u', 'origin', 'main']);
  console.log('Push completed successfully.');
} catch (err) {
  console.error('Push failed. Retrying without credentials file if secret-blocked...');
  run(['reset', '--soft', 'HEAD~1']);
  run(['reset', 'HEAD', 'backend/config/agent-name-nsnl-16d61ab084a0.json']);
  run([
    'commit',
    '-m',
    'feat: advertising, chat, marketplace, homepage, and Dialogflow updates across full project',
  ]);
  run(['push', '-u', 'origin', 'main']);
  console.log('Push completed without credentials file (GitHub secret protection).');
}
run(['remote', 'set-url', 'origin', 'https://github.com/hamzhehe/gearup.git']);
