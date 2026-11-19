# CampaignIQ design standards

The shared rules in `src/design-system.css` apply to every persona. Keep workspace styling consistent by following these standards:

- Use the shared page shells (`PageHeader`, `BhPage`, `TmPage`, and the Marketing Head page shell) for page titles.
- Keep page titles at the shared page-title scale and section titles at the shared section-title scale. Do not add persona-specific title sizes or colors.
- Use green for active/completed workflow state and observed/actual performance. Use amber for planned/target measures and warnings. Use red for risks and blue for information.
- For charts with planned and observed series, use the semantic series names so the shared chart theme assigns the same colors in every persona.
- Use the existing design tokens in `styles.css` for surfaces, borders, spacing, and semantic colors. Avoid adding one-off hex colors to persona stylesheets.

When adding a new persona workspace, reuse shared shells and tokens instead of creating another visual system.
