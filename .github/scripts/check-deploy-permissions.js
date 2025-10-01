// @ts-check

/**
 * @typedef {Schemas['webhook-pull-request-opened']} PullRequest
 */

/**
 * Check if the current GitHub event should trigger a deployment
 * @param {object} params
 * @param {object} params.core - GitHub Actions core utilities
 * @param {object} params.context - GitHub Actions context
 */
module.exports = async ({ core, context }) => {

  // check if author is authorized
  if (context.eventName === 'pull_request') {
    const event = /** @type {PullRequest} */ (context.payload);
    const authorAssociation = event.pull_request.author_association;

    if (!isAllowedAuthor(authorAssociation)) {
      await skipDeployment(core, 'The PR author is not authorized to run deployments.');
      return;
    }

    core.setOutput('should-deploy', 'true');
    core.info('Deployment allowed: Authorized contributor');
    return;
  }

  // no deployment for other events
  core.setOutput('should-deploy', 'false');
  core.info('Deployment not triggered for this event type');
};

/**
 * Check if the author association allows deployment
 * @param {string} authorAssociation - The author's association with the repository
 * @returns {boolean} Whether the author is allowed to deploy
 */
function isAllowedAuthor(authorAssociation) {
  return (
    authorAssociation === 'OWNER' ||
    authorAssociation === 'MEMBER' ||
    authorAssociation === 'COLLABORATOR'
  );
}

/**
 * Skip deployment and set appropriate outputs
 * @param {object} core - GitHub Actions core utilities
 * @param {string} reason - Reason for skipping deployment
 */
async function skipDeployment(core, reason) {
  core.info('Skipping deployment for security reasons.');
  core.setOutput('should-deploy', 'false');
  await core.summary
    .addQuote(`🚫 Deployment skipped: ${reason}`)
    .addDetails(
      'Security Notice',
      'Deployments are restricted to organization members, collaborators, and repository owners for security reasons. External contributors can still run builds and tests.'
    )
    .write();
}