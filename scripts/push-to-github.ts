// Script to push project to GitHub
import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const REPO_NAME = process.argv[2] || 'my-replit-project';
const REPO_DESCRIPTION = process.argv[3] || 'Project created in Replit';

// Files and directories to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.replit',
  'replit.nix',
  '.config',
  '.upm',
  '.cache',
  'dist',
  '.env',
  '*.log',
  'scripts/push-to-github.ts'
];

function shouldIgnore(filePath: string): boolean {
  const basename = path.basename(filePath);
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.startsWith('*')) {
      return basename.endsWith(pattern.slice(1));
    }
    return basename === pattern || filePath.includes(`/${pattern}/`) || filePath.startsWith(`${pattern}/`);
  });
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const relativePath = fullPath;
    
    if (shouldIgnore(relativePath)) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function createTreeFromFiles(octokit: any, owner: string, repo: string, files: string[]) {
  const tree = [];
  
  for (const filePath of files) {
    const content = fs.readFileSync(filePath);
    const relativePath = filePath.startsWith('./') ? filePath.slice(2) : filePath;
    
    // Create a blob for each file
    const blob = await octokit.git.createBlob({
      owner,
      repo,
      content: content.toString('base64'),
      encoding: 'base64'
    });
    
    tree.push({
      path: relativePath,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: blob.data.sha
    });
    
    console.log(`  Added: ${relativePath}`);
  }
  
  return tree;
}

async function main() {
  try {
    console.log('Connecting to GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    // Check if repo exists
    let repoExists = false;
    try {
      await octokit.repos.get({ owner: user.login, repo: REPO_NAME });
      repoExists = true;
      console.log(`Repository ${REPO_NAME} already exists.`);
    } catch (e: any) {
      if (e.status !== 404) throw e;
    }
    
    // Create repo if it doesn't exist
    if (!repoExists) {
      console.log(`Creating repository: ${REPO_NAME}...`);
      await octokit.repos.createForAuthenticatedUser({
        name: REPO_NAME,
        description: REPO_DESCRIPTION,
        private: false,
        auto_init: true
      });
      console.log('Repository created!');
      
      // Wait a moment for GitHub to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Get all files
    console.log('\nGathering files...');
    const files = getAllFiles('.');
    console.log(`Found ${files.length} files to upload.`);
    
    // Get the latest commit SHA
    const { data: ref } = await octokit.git.getRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main'
    });
    const latestCommitSha = ref.object.sha;
    
    // Get the tree SHA of the latest commit
    const { data: commit } = await octokit.git.getCommit({
      owner: user.login,
      repo: REPO_NAME,
      commit_sha: latestCommitSha
    });
    
    console.log('\nCreating file blobs...');
    const tree = await createTreeFromFiles(octokit, user.login, REPO_NAME, files);
    
    // Create a new tree
    console.log('\nCreating tree...');
    const { data: newTree } = await octokit.git.createTree({
      owner: user.login,
      repo: REPO_NAME,
      tree,
      base_tree: commit.tree.sha
    });
    
    // Create a new commit
    console.log('Creating commit...');
    const { data: newCommit } = await octokit.git.createCommit({
      owner: user.login,
      repo: REPO_NAME,
      message: 'Push from Replit',
      tree: newTree.sha,
      parents: [latestCommitSha]
    });
    
    // Update the reference
    console.log('Updating branch...');
    await octokit.git.updateRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main',
      sha: newCommit.sha
    });
    
    console.log('\n✓ Successfully pushed to GitHub!');
    console.log(`\nRepository URL: https://github.com/${user.login}/${REPO_NAME}`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Details:', error.response.data);
    }
    process.exit(1);
  }
}

main();
