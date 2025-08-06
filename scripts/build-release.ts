import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import { compare } from 'compare-versions';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const repo = process.env.GITHUB_REPOSITORY!;
const token = process.env.GITHUB_ACCESS_TOKEN;
const githubSha = process.env.GITHUB_SHA ?? 'main';

const owner = repo.split('/')[0];
const repoName = repo.split('/')[1];

const octokit = new Octokit({ auth: token });

// #region Helper function
async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000) {
  try {
    return await fn();
  } catch (err: any) {
    const isRetryable =
      err.status === 500 ||
      err.status === 502 ||
      err.status === 503 ||
      err.status === 504 ||
      err.code === 'EPIPE' ||
      err.message?.includes('fetch failed') ||
      err.message?.includes('other side closed');

    if (retries > 0 && isRetryable) {
      console.warn(`[retry] ${err.message || err} - retrying in ${delayMs}ms... (${retries} left)`);
      await new Promise((r) => setTimeout(r, delayMs));
      return retry(fn, retries - 1, delayMs);
    }

    throw err;
  }
}

async function getAllTags() {
  const tags = await retry(() =>
    octokit.paginate(octokit.rest.repos.listTags, {
      owner,
      repo: repoName,
      per_page: 100,
    }),
  );

  return tags;
}

async function getRelease() {
  try {
    const res = await retry(() =>
      octokit.rest.repos.getLatestRelease({
        owner,
        repo: repoName,
      }),
    );
    return res.data;
  } catch (error: any) {
    if (error.status !== 404) throw error;

    const res = await retry(() =>
      octokit.rest.repos.listReleases({
        owner,
        repo: repoName,
        per_page: 1,
      }),
    );
    return res.data[0] ?? null;
  }
}

function determineNewVersion(prev: string, current: string): string {
  if (compare(current, prev, '<=')) {
    const [maj, min, patch] = prev.split('.').map(Number);
    return `${maj}.${min}.${patch + 1}`;
  }
  return current;
}

async function getLatestCommitSha() {
  const latestCommit = await retry(() =>
    octokit.rest.repos.getCommit({
      owner,
      repo: repoName,
      ref: githubSha,
    }),
  );
  return latestCommit.data.sha;
}

async function getFirstCommitSha() {
  const firstCommit = await retry(() =>
    octokit.rest.repos.listCommits({
      owner,
      repo: repoName,
      per_page: 1,
      page: 1000000,
    }),
  );
  return firstCommit.data[0]?.sha;
}

// #endregion

// #region Main function
async function checkVersion() {
  const allTags = await getAllTags();

  const versionCode = allTags.length + 1;
  const currentVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  const previousVersion = ((await getRelease()) ?? { tag_name: 'v0.0.0' }).tag_name.replace(/^v/, '');

  const newVersion = determineNewVersion(previousVersion, currentVersion);

  return { allTags, newVersion, previousVersion, versionCode };
}

async function createChangelog(allTags: any[], prevTag: string) {
  let commits: { message: string }[] = [];
  let baseSha: string;
  const headSha = await getLatestCommitSha();

  if (prevTag === 'v0.0.0') {
    baseSha = await getFirstCommitSha();
    if (!baseSha) throw new Error('Cannot determine first commit SHA.');
  } else {
    const foundTag = allTags.find((tag) => tag.name === prevTag);
    if (!foundTag) throw new Error(`Tag ${prevTag} not found.`);
    baseSha = foundTag.commit.sha;
  }

  const comparison = await retry(() =>
    octokit.rest.repos.compareCommits({
      owner,
      repo: repoName,
      base: baseSha,
      head: headSha,
    }),
  );
  commits = comparison.data.commits.map((c) => ({ message: c.commit.message }));

  return commits.length > 0
    ? commits.map((c) => `- ${c.message.split('\n')[0]}`).join('\n')
    : 'No changes in this release.';
}

async function createRelease(name: string, tagName: string, changelogs: string) {
  const filePath = path.resolve('android/app/build/outputs/apk/release/app-release-signed.apk');
  const fileSize = fs.statSync(filePath).size;
  const fileData = fs.readFileSync(filePath);
  const fileName = name.replace(/ /g, '-') + '.apk';

  const release = await retry(() =>
    octokit.rest.repos.createRelease({
      owner,
      repo: repoName,
      tag_name: tagName,
      name: name,
      body: changelogs,
      draft: false,
      prerelease: false,
    }),
  );

  await retry(() =>
    octokit.rest.repos.uploadReleaseAsset({
      owner,
      repo: repoName,
      release_id: release.data.id,
      name: fileName,
      data: fileData as any,
      headers: {
        'content-type': 'application/vnd.android.package-archive',
        'content-length': fileSize,
      },
    }),
  );
}
// #endregion

async function main() {
  // Check Version
  const { allTags, newVersion, previousVersion, versionCode } = await checkVersion();

  // Set Version
  execSync(`npx capacitor-set-version set:android -v ${newVersion} -b ${versionCode}`, { stdio: 'inherit' });

  // Build Source
  execSync('npm run build', { stdio: 'inherit' });

  // Sync Capacitor
  execSync('npx cap sync android', { stdio: 'inherit' });

  // Build APK
  execSync('npx cap build android', { stdio: 'inherit' });

  // Create Changelogs
  const changelog = await createChangelog(allTags, `v${previousVersion}`);

  // Create Release
  await createRelease(`SpendWise v${newVersion}`, `v${newVersion}`, changelog);
}

main().catch((error) => {
  console.log(error);
  process.exit(1);
});
