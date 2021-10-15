// Imports
const core = require("@actions/core");
const cache = require("@actions/cache");
const shell = require("shelljs");
const { makeId, exec, getInputAsArray } = require("./utils");

// Exports
module.exports = { buildArticle };

/**
 * Build the article.
 *
 */
async function buildArticle(ARTICLE_CACHE_NUMBER = null) {
  // Article cache settings. We're caching pretty much everything
  // in the repo, but overriding it with any files that changed since
  // the commit at which we cached everything
  // Note that the GITHUB_REF (branch) is part of the cache key
  // so we don't mix up the caches for different branches!
  const ACTION_PATH = core.getInput("action-path");
  if (ARTICLE_CACHE_NUMBER == null)
    ARTICLE_CACHE_NUMBER = core.getInput("article-cache-number");
  const RUNNER_OS = shell.env["RUNNER_OS"];
  const GITHUB_REF = shell.env["GITHUB_REF"];
  const randomId = makeId(8);
  const article_key = `article-${RUNNER_OS}-${GITHUB_REF}-${ARTICLE_CACHE_NUMBER}-${randomId}`;
  const article_restoreKeys = [
    `article-${RUNNER_OS}-${GITHUB_REF}-${ARTICLE_CACHE_NUMBER}`,
  ];
  const article_paths = [
    ".snakemake",
    ".showyourwork",
    ".last-commit",
    "environment.yml",
    "ms.pdf",
    "src",
  ];

  // Restore the article cache
  core.startGroup("Restore article cache");
  const article_cacheKey = await cache.restoreCache(
    article_paths,
    article_key,
    article_restoreKeys
  );
  exec(`rm -f .showyourwork/repo.json`); // Always re-generate this!
  exec(`python ${ACTION_PATH}/src/cache.py --restore`);
  core.endGroup();

  // Outputs
  var output = [];

  // Build the article
  core.startGroup("Build article");
  if (core.getInput("verbose") == "true") {
    exec("snakemake -c1 --use-conda --verbose --reason --notemp ms.pdf");
  } else {
    exec("snakemake -c1 --use-conda --reason --notemp ms.pdf");
  }
  output.push("ms.pdf");
  core.endGroup();

  // Build arxiv tarball
  if (core.getInput("arxiv-tarball") == "true") {
    const arxiv_tarball_exclude = getInputAsArray("arxiv-tarball-exclude").join(
      ","
    );
    core.startGroup("Build ArXiV tarball");
    if (core.getInput("verbose") == "true") {
      exec(
        `snakemake -c1 --use-conda --verbose --reason --notemp arxiv.tar.gz --config arxiv_tarball_exclude=${arxiv_tarball_exclude}`
      );
    } else {
      exec(
        `snakemake -c1 --use-conda --reason --notemp arxiv.tar.gz --config arxiv_tarball_exclude=${arxiv_tarball_exclude}`
      );
    }
    output.push("arxiv.tar.gz");
    core.endGroup();
  }

  // Save article cache
  core.startGroup("Update article cache");
  exec(`python ${ACTION_PATH}/src/cache.py --update`);
  const article_cacheId = await cache.saveCache(article_paths, article_key);
  core.endGroup();

  return output;
}
