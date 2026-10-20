import type { AsyncFunctionArguments } from 'github-script';

interface WorkerSummary {
  /** Display name used in the results table. */
  label: string;
  /** Prefix of the `*_URL`, `*_VERSIONED_URL` and `*_OUTCOME` environment variables. */
  envKey: string;
}

const WORKERS: WorkerSummary[] = [
  { label: 'API', envKey: 'API' },
  { label: 'CDN', envKey: 'CDN' },
  { label: 'App', envKey: 'FRONTEND' },
];

/**
 * Builds the deployment results summary shared by the `Deploy` and `Preview PR`
 * workflows, so both render identical tables and links.
 *
 * Expected environment variables:
 * - `SUMMARY_HEADING` (optional): heading of the summary. Defaults to "Deployment results".
 * - `SUMMARY_INTRO` (optional): paragraph rendered right below the heading.
 * - `<WORKER>_URL` / `<WORKER>_VERSIONED_URL`: URLs reported by the deploy step.
 * - `<WORKER>_OUTCOME`: outcome of the deploy step.
 */
export default async function buildDeploySummary({ core }: AsyncFunctionArguments) {
  const { env } = process;

  core.summary.addHeading(env.SUMMARY_HEADING?.trim() || 'Deployment results', 'h2');

  const intro = env.SUMMARY_INTRO?.trim();
  if (intro) {
    core.summary.addRaw(intro, true);
  }

  const rows = WORKERS.map(({ label, envKey }) => {
    const url = env[`${envKey}_URL`] ?? '';
    const versionedUrl = env[`${envKey}_VERSIONED_URL`] ?? '';
    const outcome = env[`${envKey}_OUTCOME`] || 'unknown';
    return `| ${label} | ${getTableText(url, versionedUrl, outcome)} |`;
  });

  core.summary.addRaw(
    [
      '| Worker | Alias | URL | Outcome |',
      '| ------ | ----- | --- | ------- |',
      ...rows,
    ].join('\n'),
    true
  );

  const repoUrl = `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}`;
  const runId = env.GITHUB_RUN_ID;
  core.summary.addSeparator();
  core.summary.addLink(`Logs #${runId}`, `${repoUrl}/actions/runs/${runId}`);

  await core.setOutput('summary', core.summary.stringify());
  await core.summary.write();
}

function getTableText(url: string, versionedUrl: string, outcome: string): string {
  if (outcome !== 'success') {
    return ['-', '-', outcome].join(' | ');
  }

  return [url !== versionedUrl ? getUrlText(url) : '-', getUrlText(versionedUrl), outcome].join(
    ' | '
  );
}

function getUrlText(url: string): string {
  if (!url) {
    return '-';
  }

  const match = /^https?:\/\/([a-z0-9]+)-/i.exec(url);
  return `[${match?.[1] ?? url}](${url})`;
}
