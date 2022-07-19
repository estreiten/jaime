git fetch
sleep 5
git checkout -- .
git log --format=%B @{u}...HEAD
if [ -n "$2" ]; then
  git checkout $1
fi
git pull