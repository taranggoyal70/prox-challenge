console.log(`ArcLens commands

  npm run dev                 Start the no-key or live-local app. Network: optional. Spend: user-triggered only.
  npm run doctor              Check the selected mode. Network/key: mode-dependent. Spend: no generation.
  npm run check:knowledge     Validate committed knowledge assets. Network: no. Spend: none.
  npm run test                Run offline tests. Network: no. Spend: none.
  npm run verify              Run knowledge, types, lint, tests, and production build. Network: no after install.

Cost-bearing eval commands are added with the live evaluation phase and will require explicit --yes.
`);
