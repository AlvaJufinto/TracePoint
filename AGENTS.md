# AGENTS.md

Development guidelines for this project. Read this before making changes.

---

## 1. Project Overview

React + Vite application using Tailwind CSS for styling, React Router DOM for routing, and Axios for HTTP requests. This is a clean, minimal starter — there are no business-domain features yet.

---

## 2. Tech Stack

- React 19.x
- Vite 8.x
- Tailwind CSS 4.x (via `@tailwindcss/vite`)
- React Router DOM 7.x
- Axios 1.x
- TypeScript (TSX for React components)

---

## 3. Directory Structure

```
my-app/
├── public/
├── src/
│   ├── components/   # Reusable UI components (not yet created)
│   ├── layouts/      # Shared page layouts (not yet created)
│   ├── lib/          # External libraries and configured clients
│   │   └── axios.ts  # Configured Axios instance
│   ├── pages/        # Route-level page components
│   │   ├── Home.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx       # Application routing (createBrowserRouter + RouterProvider)
│   ├── index.css     # Tailwind import + minimal global CSS
│   └── main.tsx      # React entry point
├── .env.example
├── .gitignore
├── AGENTS.md
├── package.json
├── vite.config.ts
└── index.html
```

Only document directories that actually exist. Do not introduce a directory until it has a real file in it.

---

## 4. Component Rules

- Components have a single clear responsibility.
- Prefer small composable components over large monolithic ones.
- Do not create abstractions for one-off code without a reason.
- Keep business logic out of purely presentational components when practical.
- Reuse a component only when there is actual repetition — not on speculation.

---

## 5. Pages and Routing

- Route-level components live in `src/pages/`.
- Shared layouts (if needed later) live in `src/layouts/`.
- Reusable UI belongs in `src/components/`.
- Internal navigation uses React Router (`Link`, `navigate`) — not raw `<a>` tags for in-app routes.
- The default router is `createBrowserRouter` + `RouterProvider` (established in `App.tsx`).

---

## 6. Styling Rules

- Prefer Tailwind utility classes.
- Keep global CSS limited to genuinely global concerns (e.g. Tailwind import, CSS variables, base resets).
- Do not introduce another CSS framework.
- Avoid arbitrary values when an existing Tailwind utility is sufficient.
- Keep class lists readable; avoid massive inline class strings.
- Do not build a huge custom design system prematurely.

---

## 7. Axios / API Rules

- Use the configured Axios instance from `src/lib/axios.ts`.
- Do not create random `axios.create()` calls throughout the application.
- The API base URL comes from `VITE_API_URL` (read from `import.meta.env`).
- Never hardcode environment-specific API URLs in source code.
- Do not put secrets in frontend source code or `VITE_*` variables.
- Do not add interceptors, auth layers, or service abstractions until actual API complexity requires them.

---

## 8. State Management

No global state-management library is currently used.

- Prefer local React state (`useState`, `useReducer`) when possible.
- Do not introduce Zustand, Redux, MobX, Jotai, or another state library without a concrete requirement.
- Do not move state into a global store merely for convenience.
- Lift state only when multiple components genuinely need the same state.

---

## 9. Dependency Rules

Do not add dependencies casually.

- Before adding a dependency, determine whether the requirement can reasonably be solved with existing tools.
- Avoid duplicate libraries that solve the same problem.
- Keep dependencies aligned with actual application requirements, not trends.

Current core dependencies:

- react
- react-dom
- vite
- @tailwindcss/vite
- tailwindcss
- react-router-dom
- axios

TypeScript and ESLint-related packages are dev dependencies. Do not claim exact versions unless verified from `package.json`.

---

## 10. Naming Conventions

- Components: PascalCase (`Home`, `NotFound`, `Button`)
- Pages: PascalCase (same as components, but live in `src/pages/`)
- JavaScript/TypeScript variables: camelCase
- Functions: camelCase
- Constants: `camelCase` for ordinary constants; `UPPER_SNAKE_CASE` for config-like or module-level constants (e.g. environment keys)
- Files: match the primary exported component or module name (e.g. `Home.tsx`, `axios.ts`)

Use descriptive names. Avoid meaningless names such as `data`, `thing`, `stuff`, `temp`, `foo`, `bar` unless their scope genuinely makes the meaning obvious.

---

## 11. React Conventions

- Use functional components.
- Use hooks appropriately. Do not use `useEffect` for derived state that can be calculated directly.
- Avoid unnecessary state.
- Avoid unnecessary memoization (`useMemo`, `useCallback`) — add it when profiling or clear reasoning shows it is needed, not by default.
- Do not optimize prematurely.
- Keep effects focused.

---

## 12. Code Style

- Follow the existing ESLint configuration (`eslint.config.js`).
- Prefer readable code over clever code.
- Keep functions reasonably focused.
- Avoid deeply nested logic.
- Do not add comments that merely restate obvious code.
- Comments should explain non-obvious reasoning, constraints, or why a particular approach was chosen.
- Do not create excessive comments.

---

## 13. YAGNI / Architecture Philosophy

Follow YAGNI.

Do not build infrastructure for hypothetical future requirements.

Before introducing an abstraction, ask:

1. Is there a real current requirement?
2. Is the pattern repeated enough to justify abstraction?
3. Does the abstraction make the code simpler rather than more complicated?

Prefer straightforward implementations. Avoid premature layers: hooks/ services/ stores/ contexts/ utils/ types/ config/ constants folders should not be created just because they might be useful later.

---

## 14. Error Handling

- Do not silently swallow errors.
- Handle user-facing errors where appropriate.
- Avoid giant `try/catch` blocks around unrelated code.
- Do not add elaborate error-handling infrastructure prematurely.

---

## 15. Environment Variables

The project exposes frontend environment variables through Vite. These are NOT secrets — they are embedded into the client bundle.

- `VITE_API_URL` — API base URL used by the configured Axios instance.
- Define values in `.env` for local development; document expected keys in `.env.example`.

Never put private credentials, API keys, or secrets into `VITE_*` variables.

---

## 16. PWA Policy

This project is NOT a PWA.

Do not add:

- `vite-plugin-pwa`
- service workers
- Workbox
- PWA registration
- install-prompt logic
- PWA-specific manifests

unless the project requirements explicitly change.

---

## 17. Agent Workflow

When working on this project, future coding agents should:

1. Inspect the existing implementation first.
2. Understand the current architecture before changing it.
3. Reuse existing patterns instead of inventing new ones.
4. Make the smallest reasonable change that solves the task.
5. Avoid unrelated refactors.
6. Avoid adding dependencies without justification.
7. Verify changes after implementation using the available commands.
8. Report what was actually verified, not what is assumed.
9. Never claim tests or builds passed unless they were actually run.
10. Ask for clarification when a requirement is genuinely ambiguous instead of inventing one.

---

## 18. Before Adding New Files

Consider whether an existing file can reasonably be extended first.

Do not create:

- `Button.jsx`
- `Button2.jsx`
- `NewButton.jsx`
- `ButtonNew.jsx`
- `ButtonFinal.jsx`

or similar duplicate implementations. If a component is genuinely reusable, place it in the appropriate directory (`src/components/`) and keep it consistent with existing conventions.

---

## 19. Before Adding New Dependencies

Require an explanation of:

- What problem the dependency solves.
- Why existing dependencies are insufficient.
- Whether the dependency introduces overlapping functionality.

Do not install packages just because they are popular or because another project uses them.

---

## 20. Verification

Standard commands:

```bash
npm run dev      # Start development server
npm run build    # Type-check + production build
npm run lint     # ESLint check (exists in this project)
npm run preview  # Preview production build locally
```

Only rely on a command result if it was actually executed. Do not assume the build or lint passed without running it.
