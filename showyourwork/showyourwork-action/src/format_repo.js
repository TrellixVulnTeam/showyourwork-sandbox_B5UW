// Imports
const core = require("@actions/core");
const shell = require("shelljs");

// Exports
module.exports = { formatRepo };

// Get repo info
const GITHUB_SLUG = shell.env["GITHUB_REPOSITORY"];
const GITHUB_USER = GITHUB_SLUG.split("/")[0];
const GITHUB_REPO = GITHUB_SLUG.split("/")[1];
const GITHUB_BRANCH = shell
  .exec("git rev-parse --abbrev-ref HEAD")
  .replace(/(\r\n|\n|\r)/gm, "");
const GITHUB_TOKEN = core.getInput("github-token");
const ACTION_PATH = core.getInput("action-path");

// Year for the license
const YEAR = new Date().getFullYear();

/**
 * Format files if this is a fresh repo based on the template.
 *
 */
function formatRepo() {
  // Check if this is a fresh fork
  if (shell.grep("<!-- SHOWYOURWORK_TEMPLATE -->", "README.md").length > 1) {
    //
    core.startGroup(`Format the repository`);

    // Undo any changes caused by this action so far and
    // update the repo in case things changed since the action started
    shell.exec("git reset --hard HEAD");
    shell.exec(`git pull origin ${GITHUB_BRANCH}`);

    // Customize the README.md and LICENSE files
    shell.cp(`${ACTION_PATH}/resources/README.md`, "README.md");
    shell.cp(`${ACTION_PATH}/resources/LICENSE`, "LICENSE");
    shell.sed("-i", "{{ GITHUB_SLUG }}", GITHUB_SLUG, "README.md");
    shell.sed("-i", "{{ GITHUB_USER }}", GITHUB_USER, "README.md");
    shell.sed("-i", "{{ GITHUB_REPO }}", GITHUB_REPO, "README.md");
    shell.sed("-i", "{{ GITHUB_BRANCH }}", GITHUB_BRANCH, "README.md");
    shell.sed("-i", "{{ GITHUB_USER }}", GITHUB_USER, "LICENSE");
    shell.sed("-i", "{{ YEAR }}", YEAR, "LICENSE");

    // Commit and push
    try {
      shell.exec("git add README.md");
      shell.exec("git add LICENSE");
      shell.exec(
        "git -c user.name='showyourwork' -c user.email='showyourwork' " +
          "commit -m '[skip ci] One-time autocommit to finish repo setup'"
      );
      shell.exec(
        "git push " +
          `https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_SLUG} ` +
          `${GITHUB_BRANCH}`
      );
    } catch (error) {
      core.warning(error.message);
    }

    core.endGroup();
  }
}
