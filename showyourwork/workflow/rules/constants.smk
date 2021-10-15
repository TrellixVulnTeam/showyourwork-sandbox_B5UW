from pathlib import Path, PurePosixPath


# Convert a path object to a string containing the POSIX path
POSIX = lambda path: str(PurePosixPath(path))


# TODO: Is there a better way of getting abs paths?
WORKFLOW = (
    Path(workflow.modules["showyourwork"].snakefile).absolute().parents[0]
)
USER = Path(workflow.basedir)


# Relative paths (to top level of user's repo)
TEX = Path("src")
FIGURES = Path("src") / "figures"
GITHUB = Path(".github")
TEMP = Path(".showyourwork")
if not TEMP.exists():
    os.mkdir(str(TEMP))


# Dummy file dependency for figures w/ unknown parent scripts
UNKNOWN_SCRIPT = "unknown-script"


# Temporary tex files
TMPTEXFILE = ".showyourwork-xml-ms"
SYWTEXFILE = ".showyourwork-ms"


# Auxiliary files we copy over to the user's `src/` directory
AUXFILES = [
    POSIX(TEX / file.name)
    for file in (WORKFLOW / "resources" / "tex").glob("*.*")
]

# Class-specific auxiliary files
CLASSFILES = {}
for folder in (WORKFLOW / "resources" / "classes").glob("*"):
    CLASSFILES[folder.name] = [
        file.name
        for file in (WORKFLOW / "resources" / "classes" / folder).glob("*.*")
    ]

# Tectonic command
if tectonic_latest:
    tectonic_cmd = str(TEMP / "tectonic")
    tectonic_files = [POSIX(TEMP / "tectonic")]
else:
    tectonic_cmd = "tectonic"
    tectonic_files = []