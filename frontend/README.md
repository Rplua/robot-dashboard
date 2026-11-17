# Robot Dashboard Frontend

React, TypeScript, Vite, Tailwind CSS and React Router.

```bash
npm ci
npm run dev
```

## Folder structure

| Path | Purpose |
| --- | --- |
| `src/main.tsx` | Browser entry point that mounts React. |
| `src/App.tsx` | Application shell and route definitions. |
| `src/index.css` | Tailwind entry point and shared design tokens. |
| `src/pages/` | Page components for controller connection and the dashboard. |
| `src/components/` | UI pieces used by pages, such as status indicators, the program pointer and the execution controls. |
| `src/api/` | Typed HTTP calls to FastAPI and their request and response types. |
| `src/hooks/` | React logic for subscribing to live RAPID values and closing the WebSocket. |

## Screen flow

1. `/connect` shows the controller HTTPS URL, username and password fields. Keep the password in form state and clear it after a successful connection. Call `POST /controller/connect` and navigate to `/dashboard` when it succeeds.
2. `/dashboard` checks `GET /controller/identity` on entry. Redirect to `/connect` when the backend reports that there is no controller session. Show the controller and disconnect action in the header, then RAPID execution state, program pointer, write access holder and the live `test_value` counter.
3. Group Start/Resume, Stop and PP to Main in the execution panel. Keep routine selection with the program pointer. Include a field to write `test_value`, and display command errors by the affected controls. Use `GET` for the initial variable value and `/ws/rapid` for updates.

## Visual direction

Use a dark graphite background, thin panel borders, Inter for labels, and IBM Plex Mono for program pointers and values. Use blue for the primary action, green for running, amber for attention and red for Stop and errors. Pair colors with text labels. On small screens, stack the panels in reading order.

- [ABB AppStudio](https://www.abb.com/global/en/areas/robotics/products/software/appstudio) is the reference for grouping controls by robot operation.
- [Grafana Stat panels](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/visualizations/stat/) are the reference for quickly reading the live counter and status.
