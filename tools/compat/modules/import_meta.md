---
__compat:
  description: "<code>import.meta</code>"
  mdn_url: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/import.meta
  spec_url:
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta
  - https://vite.dev/guide/env-and-mode
  - https://webpack.js.org/api/module-variables/#importmeta
  support:
    vite:
      version_added: 1.0.0
    webpack:
      version_added: 5.0.0
    nodejs:
      version_added: 18.19.0
    bun:
      version_added: 1.0.0
    deno:
      version_added: 1.28.0
    esbuild:
      version_added: 0.18.0
    rspack:
      version_added: 1.1.0
    rsbuild:
      version_added: 1.1.0
  status:
    experimental: false
    standard_track: true
    deprecated: false
url:
  __compat:
    description: "<code>import.meta.url</code>"
    support:
      vite:
        version_added: 1.0.0
      webpack:
        version_added: 5.0.0
        notes:
        - "<code>import.meta.url</code> has <code>file://</code> protocol"
      nodejs:
        version_added: 18.19.0
        notes:
        - "<code>import.meta.url</code> has <code>file://</code> protocol"
        - Cannot <code>fetch()</code> the result of <code>import.meta.url</code>
      bun:
        version_added: 1.0.0
        notes:
        - "<code>import.meta.url</code> has <code>file://</code> protocol"
      deno:
        version_added: 1.28.0
        notes:
        - "<code>import.meta.url</code> has <code>file://</code> protocol"
      esbuild:
        version_added: false
      rspack:
        version_added: 1.1.0
        notes:
        - "<code>import.meta.url</code> has <code>file://</code> protocol"
      rsbuild:
        version_added: 1.1.0
        notes:
        - "<code>import.meta.url</code> has <code>file://</code> protocol"
    status:
      experimental: false
      standard_track: true
      deprecated: false
  web_worker:
    __compat:
      description: "<code>Worker</code> from <code>import.meta.url</code>"
      mdn_url: https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker#url
      support:
        vite:
          version_added: 1.0.0
        webpack:
          version_added: 5.0.0
        nodejs:
          version_added: 18.19.0
          notes:
          - Using the <code>node:worker_threads</code> API
          - 'Fails: <code>import.meta.url</code> can load a <code>Worker</code>'
          partial_implementation: true
        bun:
          version_added: 1.1.0
        deno:
          version_added: 1.28.0
        esbuild:
          version_added: false
        rspack:
          version_added: 1.1.0
        rsbuild:
          version_added: 1.1.0
      status:
        experimental: false
        standard_track: true
        deprecated: false
resolve:
  __compat:
    description: "<code>import&#8288;.meta.resolve</code>"
    support:
      nodejs:
        version_added: 18.19.0
        notes:
        - Cannot <code>fetch()</code> the result of <code>import.meta.resolve</code>
      vite:
        version_added: 5.0.0
        notes:
        - Cannot <code>fetch()</code> the result of <code>import.meta.resolve</code>
      webpack:
        version_added: false
      bun:
      - version_added: 1.1.0
      - version_added: 1.0.0
        version_removed: 1.1.0
        notes:
        - Cannot <code>fetch()</code> the result of <code>import.meta.resolve</code>
        - 'Fails: Returns an string'
        partial_implementation: true
      deno:
        version_added: 1.28.0
      esbuild:
        version_added: false
      rsbuild:
        version_added: false
      rspack:
        version_added: false
    status:
      experimental: false
      standard_track: true
      deprecated: false
env:
  __compat:
    description: "<code>import&#8288;.meta.env</code>"
    support:
      vite:
        version_added: 1.0.0
      webpack:
        version_added: false
      bun:
        version_added: 1.1.0
        notes:
        - 'Fails: <code>import&#8288;.meta.env.{DEV,PROD}</code> exist and are
          mutually exclusive'
        - 'Fails: <code>import&#8288;.meta.env.MODE</code> is a string'
        partial_implementation: true
      deno:
        version_added: false
      esbuild:
        version_added: false
      nodejs:
        version_added: false
      rsbuild:
        version_added: 1.1.0
        notes:
        - 'Fails: <code>import&#8288;.meta.env</code> is an object'
        - 'Fails: <code>import&#8288;.meta.env</code> gracefully handles missing
          values'
        partial_implementation: true
      rspack:
        version_added: false
    status:
      experimental: true
      standard_track: false
      deprecated: false
  fallback:
    __compat:
      description: "<code>import&#8288;.meta.env?.X</code>"
      support:
        esbuild:
          version_added: 0.18.0
        rsbuild:
          version_added: 1.1.0
        vite:
          version_added: 5.0.0
        webpack:
          version_added: 5.0.0
        bun:
          version_added: 1.0.0
        deno:
          version_added: 1.28.0
        nodejs:
          version_added: 18.19.0
        rspack:
          version_added: false
      status:
        experimental: true
        standard_track: false
        deprecated: false
hot:
  __compat:
    description: "<code>import&#8288;.meta.hot</code>"
    support:
      vite:
        version_added: 1.0.0
      webpack:
        version_added: false
      bun:
        version_added: false
      deno:
        version_added: false
      esbuild:
        version_added: false
      nodejs:
        version_added: false
      rsbuild:
        version_added: false
      rspack:
        version_added: false
    status:
      experimental: true
      standard_track: false
      deprecated: false
webpack:
  __compat:
    description: "<code>import&#8288;.meta.webpack*</code>"
    support:
      vite:
        version_added: false
      webpack:
      - version_added: 5.70.0
      - version_added: 5.0.0
        version_removed: 5.70.0
        notes:
        - 'Fails: <code>import&#8288;.meta.webpackContext</code> is available'
        partial_implementation: true
      bun:
        version_added: false
      deno:
        version_added: false
      esbuild:
        version_added: false
      nodejs:
        version_added: false
      rsbuild:
        version_added: 1.1.0
      rspack:
        version_added: 1.1.0
    status:
      experimental: true
      standard_track: false
      deprecated: false
---

# `import.meta`

## Syntax

### Value

There's two distinct `import.meta` objects: The object that is referenced in source files
and the object that exists when running the bundle. Since the value is specific to
individual files, references to `import.meta` are typically replaced during bundling.

For authoring code, bundlers may support the following properties:

<dl>
  <dt><code>url</code></dt>
  <dd>A reference to the current module that can be used to reference other resources. Often used in combination with the <code>URL</code> constructor.</dd>

  <dt><code>resolve</code></dt>
  <dd>Resolves a given specifier in the context of the current file. Very similar to <code>url</code> but more concise for common use cases.</dd>

  <dt><code>hot</code> <ExperimentalInline /></dt>
  <dd>During development, this may be an object that provides APIs for handling hot replacement. The details of the API are bundler specific.</dd>

  <dt><code>env</code> <ExperimentalInline /></dt>
  <dd>Object that contains custom environment settings, e.g. those read from <code>.env</code> files.</dd>

  <dt><code>env.DEV</code> and <code>env.PROD</code> <ExperimentalInline /></dt>
  <dd>
    <code>env.DEV</code> is a boolean that specifies if development-time debug assertions should be enabled,
    e.g. because the code is running in an interactive development environment.
    It's opposite is <code>env.PROD</code> which should always be equal to <code>!env.DEV</code>.
  </dd>

  <dt><code>env.MODE</code> <ExperimentalInline /></dt>
  <dd>A string description for a "bundling mode". May include any user-defined string.</dd>

  <dt><code>env.SSR</code> <ExperimentalInline /></dt>
  <dd>A boolean that is true if the code is running as part of SSR (server-side rendering).</dd>

  <dt><code>webpack</code>, <code>webpackHot</code>, and <code>webpackContext</code> <ExperimentalInline /></dt>
  <dd>The major version of webpack used to bundle, webpack's hot module replacement API for this module, and contextual information about how this module was included in the current webpack build.</dd>
</dl>
