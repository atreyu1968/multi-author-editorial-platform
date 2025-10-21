import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function pushToGitHub() {
  try {
    console.log('🔐 Autenticando con GitHub...');
    const accessToken = await getAccessToken();
    const octokit = new Octokit({ auth: accessToken });

    // Get current user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✓ Autenticado como: ${user.login}`);

    // Get repo info from git remote
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    console.log(`📦 Repositorio: ${remoteUrl}`);

    // Configure git user
    execSync(`git config user.name "${user.login}"`, { encoding: 'utf-8' });
    execSync(`git config user.email "${user.email || user.login + '@users.noreply.github.com'}"`, { encoding: 'utf-8' });

    // Add all changes
    console.log('📝 Agregando cambios...');
    execSync('git add .', { encoding: 'utf-8' });

    // Check if there are changes to commit
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      if (!status.trim()) {
        console.log('✓ No hay cambios para commitear');
        return;
      }
    } catch (error) {
      // Continue if git status fails
    }

    // Commit changes
    const commitMessage = `Update: Fix editorial settings upsert and add UI texts seed button

- Fixed updateEditorialSettings to auto-create settings if they don't exist
- Added manual UI texts seed button in admin panel (Sistema tab)
- Improved seed script to complete missing texts without thresholds
- Increased seed timeout from 60s to 5 minutes`;

    console.log('💾 Haciendo commit...');
    try {
      execSync(`git commit -m "${commitMessage}"`, { encoding: 'utf-8' });
      console.log('✓ Commit realizado');
    } catch (error) {
      console.log('ℹ️  No hay cambios para commitear');
      return;
    }

    // Push to GitHub
    console.log('🚀 Haciendo push a GitHub...');
    const pushCmd = `git push https://${accessToken}@github.com/${user.login}/autor-landing.git HEAD:main`;
    execSync(pushCmd, { encoding: 'utf-8', stdio: 'inherit' });
    
    console.log('✅ Cambios subidos exitosamente a GitHub!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

pushToGitHub();
