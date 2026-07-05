const { execFileSync } = require('node:child_process');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '..', '..');
const git = path.join(repoDir, 'node_modules', 'dugite', 'git', 'cmd', 'git.exe');

function run(args) {
  execFileSync(git, args, { cwd: repoDir, stdio: 'inherit' });
}

const commitMessage = `fix: order financial KPIs, analytics cards, and UI polish

- Improve net revenue/spend on sales and purchase order pages
- Refine dashboard metrics grid, welcome banner, and finance utils
- Update contact, register, homepage, navigation, and transactions UI
- Order controller and trade advisor adjustments`;

run(['add', '-A']);
run(['reset', 'backend/tmp/']);
run(['reset', 'tmp_curl.html']);
run(['reset', 'backend/config/agent-name-nsnl-16d61ab084a0.json']);
run(['status', '--short']);
run(['commit', '-m', commitMessage]);

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
  console.error('Push failed:', err.message);
  process.exit(1);
} finally {
  run(['remote', 'set-url', 'origin', 'https://github.com/hamzhehe/gearup.git']);
}
