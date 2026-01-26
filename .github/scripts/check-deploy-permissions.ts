import type { AsyncFunctionArguments } from 'github-script';
import type { PullRequestEvent, IssueCommentEvent } from '@octokit/webhooks-types';

export default async function checkDeployPermissions({ core, context, github }: AsyncFunctionArguments) {
  if (context.eventName === 'issue_comment') {
    const event = context.payload as IssueCommentEvent;

    if (!event.issue.pull_request) {
      core.setOutput('should-deploy', 'false');
      core.info('Comment is not on a pull request');
      return;
    }

    if (event.comment.body?.trim() !== 'ok-to-deploy') {
      core.setOutput('should-deploy', 'false');
      core.info('Comment is not the deployment command');
      return;
    }

    const { data: permission } = await github.rest.repos.getCollaboratorPermissionLevel({
      owner: context.repo.owner,
      repo: context.repo.repo,
      username: event.comment.user.login
    });

    const isAuthorized = ['admin', 'maintain', 'write'].includes(permission.permission);

    if (!isAuthorized) {
      await skipDeployment(core, 'Not authorized to trigger deployments.');
      return;
    }

    const { data: pr } = await github.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: event.issue.number
    });

    core.setOutput('should-deploy', 'true');
    core.setOutput('pr-number', pr.number);
    core.setOutput('pr-head-sha', pr.head.sha);
    core.setOutput('pr-base-sha', pr.base.sha);
    core.info(`Deployment allowed: "ok-to-deploy" comment from authorized user @${event.comment.user.login}`);
    return;
  }

  if (context.eventName === 'pull_request') {
    const event = context.payload as PullRequestEvent;
    const authorAssociation = event.pull_request.author_association;

    if (!isAllowedAuthor(authorAssociation)) {
      await skipDeployment(
        core,
        'The PR author is not authorized to run deployments. Maintainers can trigger a deployment by commenting "ok-to-deploy" on the pull request.'
      );
      return;
    }

    core.setOutput('should-deploy', 'true');
    core.info('Deployment allowed: Authorized contributor');
    return;
  }

  if (context.eventName === 'push') {
    core.setOutput('should-deploy', 'true');
    core.info('Deployment allowed: Push to protected branch');
    return;
  }

  // no deployment for other events
  core.setOutput('should-deploy', 'false');
  core.info('Deployment not triggered for this event type');
}

function isAllowedAuthor(authorAssociation: string): boolean {
  return (
    authorAssociation === 'OWNER' ||
    authorAssociation === 'MEMBER' ||
    authorAssociation === 'COLLABORATOR'
  );
}

async function skipDeployment(coreApi: AsyncFunctionArguments['core'], reason: string): Promise<void> {
  coreApi.info('Skipping deployment for security reasons.');
  coreApi.setOutput('should-deploy', 'false');
  await coreApi.summary
    .addQuote(`🚫 Deployment skipped: ${reason}`)
    .addDetails(
      'Security Notice',
      `Deployments are restricted to organization members, collaborators, and repository owners.
      External contributors can still run builds and tests.
      Maintainers can trigger deployments by adding a regular PR comment with "ok-to-deploy" exactly.`
    )
    .write();
}
