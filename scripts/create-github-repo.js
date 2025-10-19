import { Octokit } from '@octokit/rest';

let connectionSettings;

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

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function createRepository() {
  try {
    const octokit = await getGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    // Create repository
    const repoName = 'multi-author-editorial-platform';
    console.log(`Creating repository: ${repoName}...`);
    
    const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      description: 'Multi-author editorial management platform with e-commerce, digital product downloads, and full internationalization (7 languages)',
      private: false,
      has_issues: true,
      has_projects: true,
      has_wiki: true,
      auto_init: false,
      license_template: 'mit'
    });
    
    console.log(`✓ Repository created successfully!`);
    console.log(`  URL: ${repo.html_url}`);
    console.log(`  Clone URL: ${repo.clone_url}`);
    console.log(`  SSH URL: ${repo.ssh_url}`);
    
    // Output for shell script consumption
    console.log(`\nREPO_URL=${repo.html_url}`);
    console.log(`CLONE_URL=${repo.clone_url}`);
    console.log(`SSH_URL=${repo.ssh_url}`);
    console.log(`OWNER=${user.login}`);
    
    return repo;
  } catch (error) {
    if (error.status === 422 && error.message.includes('already exists')) {
      console.error('Repository already exists. Using existing repository.');
      const octokit = await getGitHubClient();
      const { data: user } = await octokit.rest.users.getAuthenticated();
      const repoName = 'multi-author-editorial-platform';
      const { data: repo } = await octokit.rest.repos.get({
        owner: user.login,
        repo: repoName
      });
      console.log(`\nREPO_URL=${repo.html_url}`);
      console.log(`CLONE_URL=${repo.clone_url}`);
      console.log(`SSH_URL=${repo.ssh_url}`);
      console.log(`OWNER=${user.login}`);
      return repo;
    }
    console.error('Error creating repository:', error.message);
    throw error;
  }
}

createRepository().catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});
