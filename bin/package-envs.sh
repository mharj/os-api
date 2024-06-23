if [ ! -f "package.json" ]; then
  echo "package.json not found"
  exit 1
fi
if [ $(jq 'if .files == null then true else false end' package.json) == true ]; then
  echo "package.json must have a 'files' key"
  exit 1
fi
echo "PACKAGE_NAME=$(jq -r .name package.json)"
echo "PACKAGE_VERSION=$(jq -r .version package.json)"
echo "HAVE_COVERAGE_SCRIPT=$(jq 'if .scripts.coverage == null then false else true end' package.json)"
echo "HAVE_VALIDATE_SCRIPT=$(jq 'if .scripts.validate == null then false else true end' package.json)"
echo "HAVE_LINT_SCRIPT=$(jq 'if .scripts.lint == null then false else true end' package.json)"
echo "HAVE_UNIT_TEST_SCRIPT=$(jq 'if .scripts.test == null then false else true end' package.json)"
# check if pnmp lock file exists and set NPM to pnpm
if [ -f "pnpm-lock.yaml" ]; then
  echo "NPM=pnpm"
fi