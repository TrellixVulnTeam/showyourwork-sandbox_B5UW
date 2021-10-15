import subprocess
from pathlib import Path
import shutil
import sys
import os


def get_modified_files(commit="HEAD^"):
    """
    Return all files that changed since `commit`.

    """
    return [
        file
        for file in (
            subprocess.check_output(
                ["git", "diff", "HEAD", commit, "--name-only"],
                stderr=subprocess.DEVNULL,
            )
            .decode()
            .split("\n")
        )
        if len(file)
    ]


def restore_cache():
    """
    Runs after restoring the cache using @actions/cache.

    """
    # Get the commit when the files were cached
    try:
        with open(".last-commit", "r") as f:
            commit = f.readlines()[0].replace("\n", "")
    except FileNotFoundError:
        print("Cache info not found.")
        return

    # Get all files modified since that commit
    try:
        modified_files = get_modified_files(commit)
    except Exception as e:
        # Can potentially fail if force-pushing is involved!
        print(e)
        return

    # If a tracked file changed since the last commit, reset it
    # and override the cached version. This will give it a newer
    # timestamp, which will force Snakemake to re-evaluate the
    # corresponding rule.
    for file in modified_files:
        print("Ignoring cache for modified file {}.".format(file))
        try:
            subprocess.check_call(["git", "checkout", "HEAD", "--", file])
        except Exception as e:
            # Can fail if the file was deleted since the last commit
            print(e)
            try:
                subprocess.check_call(
                    ["git", "ls-files", "--error-unmatch", file]
                )
            except Exception as e:
                print(e)
                if os.path.exists(file):
                    os.remove(file)


def update_cache():
    """
    Runs before updating the cache using @actions/cache.

    """
    # Store the current commit
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"]).decode()
    with open(".last-commit", "w") as f:
        print(commit, file=f)


if __name__ == "__main__":
    assert len(sys.argv) == 2
    if sys.argv[1] == "--restore":
        restore_cache()
    elif sys.argv[1] == "--update":
        update_cache()
    else:
        raise AssertionError("")
