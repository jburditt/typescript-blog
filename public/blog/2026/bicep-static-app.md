Terraform works fine for Azure Static Web Apps, but it means managing a state file/backend for a resource that Azure already tracks itself. Bicep plus the Azure Developer CLI (`azd`) gives the same deploy/destroy/redeploy workflow without that overhead, and it fits naturally into a repo that already ships its own build output.

## Why Bicep + azd instead of Terraform

- No state file to store, lock, or lose — ARM tracks the deployed resource state server-side.
- `azd up` / `azd down` map directly to provision+deploy / teardown, which is exactly the deploy-to-save-costs-then-redeploy cycle a personal blog needs.
- A Static Web App is stateless: content is rebuilt from the repo on every deploy, so tearing the resource down between updates loses nothing.

## Files

**`infra/main.bicep`** declares the Static Web App resource:

```bicep
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
}

output staticWebAppDeploymentToken string = staticWebApp.listSecrets().properties.apiKey
output staticWebAppHostname string = staticWebApp.properties.defaultHostname
```

**`infra/main.bicepparam`** supplies the default parameter values (name, region, SKU) so the template can be deployed without extra flags.

**`azure.yaml`** is the `azd` project file. It points at the compiled `dist/` output and runs the project's own build before packaging:

```yaml
services:
  web:
    project: .
    language: js
    host: staticwebapp
    dist: dist
    hooks:
      prepackage:
        shell: sh
        run: npm run build
```

## One-time setup

1. `azd auth login`
2. `azd env new typescript-blog`
3. `azd up` — provisions the Static Web App from `infra/main.bicep` and deploys the current build

## Everyday workflow

- `azd up` — redeploy after content changes; recreates the resource if it was torn down
- `azd down --purge` — delete the resource entirely to stop paying for it between updates
- `azd up` again later — same Bicep template, same parameters, a fresh Static Web App with the latest build

## CI

`azd pipeline config` wires up GitHub OIDC federated credentials automatically, so CI never needs a stored client secret. The workflow then just runs `azd up` on push, or `azd down --force --purge` on demand:

```yaml
- name: Deploy
  run: azd up --no-prompt

- name: Destroy
  if: inputs.action == 'down'
  run: azd down --force --purge
```

## What not to put in this template

Keep anything that should survive a teardown — a database, storage account, custom domain binding — in a separate Bicep module or resource group. That way `azd down` for the blog's Static Web App never touches it.
