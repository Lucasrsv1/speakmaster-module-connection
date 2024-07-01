npm run build

copy .\README.md .\dist\

cd ./dist
git restore package.json
git restore package-lock.json

echo "Check the dist folder, and if everything is in order, bump the version number and run manually npm publish inside the dist folder."
