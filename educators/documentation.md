# How to document TC39 proposals

Explainers and specification text can be good for the development of a proposal, but may not end up as the best sort of resource for JavaScript developers who want to use the feature. As a complement, documentation is useful.

## What forms of documentation are useful?

Different people have different learning styles, so a variety of ways to introduce the same topic is helpful. This includes:
- Blog posts (some [good examples](http://2ality.com/) from Axel Rauschmayer)
- Conference talks and video guides
- Thorough reference documentation, e.g., in MDN and developers.google.com/web

Explanations can be more example-based, more theorical, or mixed. They can include different coding styles, and different examples of applications (e.g., server-side, client-side, within various frameworks, "functional programming" and "object oriented" coding styles, etc.)

## When is it useful to have this documentation?

Documentation is useful for all stages of proposal development.
- When just coming up with the idea for the proposal, and when refining it, the exercise of writing and reviewing documentation helps to understand how easily teachable and learnable the feature will be.
- When a proposal is looking for feedback in early implementations such as transpilers or polyfills, documentation is important to attract developers and explain how to use the feature, which will be necessary to get realistic feedback.
- When a proposal ships broadly across implementations, documentation will be important for all JavaScript programmers who want to use the feature, or understand code with it.

If you're not the champion of a proposal, the champion will probably be happy to have your help in writing documentation; they may be available to help review the documentation as well. You can get the collaboration started by filing an issue on the proposal repository.

## Appropriate disclaimers for proposals

Proposals which are not yet Stage 4 are subject to change or withdrawal. The strongest mark of stability is when features are shipping in JavaScript engines. Features which are not yet Stage 3 are particularly early and subject to significant change.

The instability of proposals should be prominently indicated in their documentation. The practice in MDN is to put a yellow or red banner for experimental or deprecated technologies, at the very beginning of the article; this may be useful in many contexts.

Sample text for a disclaimer for a proposal which is not yet shipped in any browser: (red background)

> [The feature] is an [experimental feature (stage *n*)](https://github.com/tc39/proposal-xxxxxx) proposed at [TC39](https://tc39.github.io/beta/), the JavaScript standards committee. Currently, no browser supports the feature, but the feature can be used through a build step with systems like [Babel](https://babeljs.io/).

## Getting started on MDN

[MDN](https://developer.mozilla.org/en-US/) welcomes documentation from early TC39 proposals ([thread](https://discourse.mozilla.org/t/mdn-tc39-collaboration/30798)). MDN is just one of many places which are useful to write documentation. To get started in developing documentation in MDN for TC39 proposals:
- File an issue to coordinate with the proposal champion on the effort.
- Follow the [MDN getting started guide](https://developer.mozilla.org/en-US/docs/MDN/Getting_started).
- Anyone with an MDN-enabled account can edit MDN articles, wiki-style. See [this article](https://developer.mozilla.org/bm/docs/MDN/Contribute/Howto/Create_and_edit_pages) for how to get permissions to create new MDN pages.
- If the feature is shipping in a web browser, document its support in [the MDN Browser Compat Data project](https://github.com/mdn/browser-compat-data) to make it easily human- and programmatically readable.
- If your article contains code samples, check them in at [the MDN interactive examples repository](https://github.com/mdn/interactive-examples) to make them live and interactive.
