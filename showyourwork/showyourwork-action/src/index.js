// Imports
const core = require("@actions/core");
const shell = require("shelljs");
const { formatRepo } = require("./format_repo");
const { setupConda } = require("./conda");
const { buildArticle } = require("./article");
const { generateReport } = require("./report");
const { publishOutput } = require("./publish");

(async () => {
  try {
    // Exit on failure
    shell.set("-e");

    const GITHUB_SLUG = shell.env["GITHUB_REPOSITORY"];
    if (GITHUB_SLUG == "rodluger/showyourwork-template") {
      // This is a template repository -- don't do anything!
      // The workflow should be disabled by default on this
      // repo, so this is just a failsafe
    } else {
      // This is a clone of the template; let's build the paper

      // Setup conda or restore from cache
      await setupConda();

      // Build the article
      var output = await buildArticle();

      // Generate the report
      var report = await generateReport();

      // Publish the article output
      await publishOutput(output, report);

      // Format repository if it's a fresh fork
      formatRepo();
    }
  } catch (error) {
    // Exit gracefully
    core.setFailed(error.message);
  }
})();
