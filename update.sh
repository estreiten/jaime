if [ -n "$2" ]; then
  git fetch origin $1
  sleep 5
  # checkout to the specified branch
  git checkout $1
fi
git log --format=%B @{u}...HEAD
git pull