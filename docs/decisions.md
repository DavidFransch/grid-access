# Decision log

One line per real choice. This becomes the README story and the interview script.

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-20 | Build a grid access map, Western Cape first | Matters, has real users, builds on Mapbox and MBCAM work |
| 2026-10-20 | Pride over revenue for now | Want something I'm proud of; business stays an option |
| 2026-10-28 | Use Eskom's 2025 GIS zones as the base layer | Names already join to the results spreadsheet (146 of 149) |
| 2026-10-28 | Show the binding (lowest) limit and which level causes it | One honest number per site, with the reason |
| 2026-10-28 | Organise raw data by dataset and edition; keep it off GitHub | Clear history; Eskom and NTCSA terms forbid redistribution |
| 2026-10-28 | Email Ronald Marais after stage 2 | A concrete map earns a reply; nothing blocks us before then |
| 2026-10-29 | Define "Western Cape" by Eskom supply area (`SupplyArea`), not province border | Capacity limits apply per supply area; column is complete and gives the expected 16 zones |
| 2026-10-29 | Processed outputs keep substation, localarea, supplyarea, geometry; all column names lowercase | Only what the map needs; one naming style across pipeline, PostGIS and API |
| 2026-10-29 | Serve the map on localhost only until NTCSA consents | Eskom/NTCSA terms forbid redistribution |
| 2026-10-29 | First users: utility-scale wind and solar developers doing early site screening (in the Western Cape, mostly wind) | Curtailment is the only route in; they need plain-language reasons, a technology toggle and validity dates. C&I installers later, with the municipal layer |
| 2026-10-29 | Multi-row substations show "up to X MW" (highest row's binding limit); popup lists every transformer group with voltage, its binding limit and limiting level | Honest best case plus full detail. 41 of 149 substations have several rows, 18 differ; none of the Western Cape ones differ (all 0 MW) |
| 2026-10-29 | Hand-enter curtailment allocations and reasons in git-ignored `data/manual/`, with page citations | Derived Eskom/NTCSA data stays off GitHub; every number keeps its source |
| 2026-10-29 | Wind capacity = base binding limit + curtailment allocation; solar = base only | Curtailment is extra wind hosting capacity (Table 4 "Total" = existing + curtailment); base is 0 MW everywhere in the Western Cape |
| 2026-10-29 | Tied limits: list every tied level, widest to narrowest, as a plain sentence ("Blocked at three levels: ... All three would need new capacity") | Shows a zone stays blocked even if one constraint lifts |
| 2026-10-29 | Galenia keeps 720 MW shared with Nuweveld, tagged "Planned substation, not yet built as of Oct 2025. Developers must self-build", plus its 280 MW of awarded round 5 wind; map notes it shows Eskom's planned 2025 grid | Quote NTCSA's own status; don't claim more than the sources do. Status question goes to Ronald |
| 2026-10-29 | Scope widened from Western Cape to national | The data is national and developers compare regions |
| 2026-10-29 | Blank limits: local and supply area filled from their area (one value each); substation area only from a same-voltage sibling row, else "not published"; filled values marked "inferred" | Never invent a limit; all three rows bind at 0 MW either way |
| 2026-10-29 | Eastern Cape curtailment from Table 7: 400 MW shared by Neptune and Pembroke; Dedisa, Delphi, Grassridge, Poseidon 0 | Same treatment as the Western Cape |
| 2026-10-29 | National summary totals supply area limits (19,940 MW) plus curtailment (1,580 MW, shared allocations once), never zone figures | Zones in one area share its capacity; adding zones would overstate it |
| 2026-10-29 | Lock the map to South Africa: flat mercator projection, centre kept inside the country, minZoom from its outline, mask from GCCA supply areas (not maxBounds, which clips the whole-country view on wide or tall screens) | No data outside South Africa; widen when another country is added |
| 2026-10-29 | Moved web to React + shadcn/ui (Radix) before the redesign | Side panel, theming and future AI and report UI need real components |
| 2026-10-29 | Zone details in a side panel (Sheet on desktop, Drawer on phones) instead of a map popup; dark theme by default, basemap follows the theme | Long details scroll properly and the map stays usable; a dark panel next to a bright map looks unfinished |
| 2026-10-29 | Conventional Commits for all commit messages (types and scopes in CLAUDE.md) | Readable history; suggested messages can be pasted without rewriting |
