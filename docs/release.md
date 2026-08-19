# Release process

Currently everything merged to the `main` branch is released to the [staging environment](https://staging-publisher-tools.webmonetization.workers.dev). To release to production, we follow these steps:

```
git switch main
git pull origin main --ff-only

git switch release
git pull origin release --ff-only

git merge main --no-ff --no-edit
git push origin release

git switch main
```

This will start a new [deployment](https://github.com/interledger/publisher-tools/actions/workflows/deploy.yml). Create a [new release](https://github.com/interledger/publisher-tools/releases/new) on GitHub and make sure to create a new tag on the `release` branch.
