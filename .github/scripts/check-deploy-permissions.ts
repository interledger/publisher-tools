import type { AsyncFunctionArguments } from '@actions/github-script';
import type { PullRequestEvent, PullRequestReviewEvent } from '@octokit/webhooks-types';

type Params = AsyncFunctionArguments & {
  context: AsyncFunctionArguments['context'] & {
    payload: PullRequestEvent | PullRequestReviewEvent;
  };
};

export default async function checkDeployPermissions({ core, context }: Params): Promise<void> {
  if (context.eventName === 'pull_request_review') {
    const event = context.payload as PullRequestReviewEvent;
    const reviewerAssociation = event.review.author_association;

    if (!isAllowedAuthor(reviewerAssociation)) {
      await skipDeployment(core, 'Not authorized to trigger deployments.');
      return;
    }

    if (event.review.body === 'ok-to-deploy') {
      core.setOutput('should-deploy', 'true');
      core.info('Deployment allowed: Triggered by maintainer review comment');
      return;
    }

    core.setOutput('should-deploy', 'false');
    core.info('No deployment command found in review');
    return;
  }

  if (context.eventName === 'pull_request') {
    const event = context.payload as PullRequestEvent;
    const authorAssociation = event.pull_request.author_association;

    if (!isAllowedAuthor(authorAssociation)) {
      await skipDeployment(
        core,
        'The PR author is not authorized to run deployments. Maintainers can trigger a deployment by submitting a review with "pull-request-review" in the comment.'
      );
      return;
    }

    core.setOutput('should-deploy', 'true');
    core.info('Deployment allowed: Authorized contributor');
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

async function skipDeployment(coreApi: Params['core'], reason: string): Promise<void> {
  coreApi.info('Skipping deployment for security reasons.');
  coreApi.setOutput('should-deploy', 'false');
  await coreApi.summary
    .addQuote(`🚫 Deployment skipped: ${reason}`)
    .addDetails(
      'Security Notice',
      `Deployments are restricted to organization members, collaborators, and repository owners.
      External contributors can still run builds and tests.
      Maintainers can trigger deployments by reviewing the PR with "pull-request-review" in the comment.`
    )
    .write();
}
