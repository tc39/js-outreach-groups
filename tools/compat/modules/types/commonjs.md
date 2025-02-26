---
cjs_in_esm:
  __compat:
    description: 'CommonJS in ESM files'
require_esm:
  __compat:
    description: '<code>require("./x.mjs")</code>'
exports_object_import_cjs:
  __compat:
    description: 'Import the exports object from CommonJS'
named_import_cjs:
  __compat:
    description: 'Detect named imports from CommonJS, e.g. via <code>__esModule</code>'
import_default_cjs:
  __compat:
    description: 'Import the default export from a CommonJS, e.g. via <code>__esModule</code>'
default_as_namespace:
  __compat:
    description: 'Namespace object may be default export, e.g. <code>ns</code> in <code>import * as ns</code> may be a function'
---

# CommonJS Modules
