import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readRepoFile = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8');

test('azure deployment config should pin azd to rg-typescript-blog and manage its lifecycle hooks', () => {
  const azureYaml = readRepoFile('azure.yaml');

  assert.match(azureYaml, /^resourceGroup: rg-typescript-blog$/m);
  assert.match(azureYaml, /preprovision:\n\s+shell: sh\n\s+run: \.\/scripts\/ensure-resource-group\.sh/);
  assert.match(azureYaml, /postdown:\n\s+shell: sh\n\s+run: \.\/scripts\/delete-resource-group\.sh/);
});

test('workflow should use rg-typescript-blog for deploy and destroy automation', () => {
  const workflow = readRepoFile('.github/workflows/deploy.yml');

  assert.match(workflow, /^\s+AZURE_RESOURCE_GROUP: rg-typescript-blog$/m);
  assert.match(workflow, /run: \|\n\s+set -euo pipefail\n\s+\.\/scripts\/ensure-resource-group\.sh\n\s+azd up --no-prompt/);
  assert.match(workflow, /az group exists --name "\$AZURE_RESOURCE_GROUP" --output tsv/);
  assert.match(workflow, /\.\/scripts\/delete-resource-group\.sh/);
});

test('resource group lifecycle scripts should only manage rg-typescript-blog', () => {
  const ensureScript = readRepoFile('scripts/ensure-resource-group.sh');
  const deleteScript = readRepoFile('scripts/delete-resource-group.sh');
  const infra = readRepoFile('infra/main.bicep');

  assert.match(ensureScript, /EXPECTED_RESOURCE_GROUP="rg-typescript-blog"/);
  assert.match(ensureScript, /az group create --name "\$resource_group" --location "\$location" --output none/);

  assert.match(deleteScript, /EXPECTED_RESOURCE_GROUP="rg-typescript-blog"/);
  assert.match(deleteScript, /az group delete --name "\$resource_group" --yes --no-wait --output none/);
  assert.match(deleteScript, /az group wait --deleted --name "\$resource_group"/);

  assert.match(infra, /targetScope = 'resourceGroup'/);
});
